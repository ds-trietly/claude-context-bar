import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, RenderSurface } from 'claude-code'

const WINDOW = 200_000

const DETACHED = ''

// Answers git as a checkout on `branch` does; DETACHED stands for a detached HEAD
function answerHost(on: On, branch: string): void {
  on('session.model', () => ({ value: 'Opus 5.5' }))
  on('process.run', (_$, e) => {
    const stdout = e.argv.includes('rev-parse') ? 'abc1234' : branch
    return { value: { exitCode: 0, stdout: `${stdout}\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
}

type Draw = {
  percent: number
  modes?: string[]
  surface?: RenderSurface
  costUsd?: number
  columns?: number
}

async function drawAt($: Engine, { percent, modes = [], surface = 'terminal', costUsd, columns }: Draw) {
  await $.session.measure({
    context: { tokens: (WINDOW * percent) / 100, window: WINDOW, percent },
    rateLimits: [],
    cost: costUsd === undefined ? undefined : { usd: costUsd },
    changed: ['context'],
  })
  const viewport = columns === undefined ? undefined : { columns, rows: 24 }
  const ui = await $.ui.mount({ plugin: 'context-bar', surface, component: 'SessionMode', props: { modes }, viewport })
  return ui.drawn()
}

test('usage stays dim below the warning level', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, { percent: 30 })).toMatchObject({
    type: 'Text',
    children: [{ type: 'Text', props: { dimColor: true }, children: ['[███30%░░░░░░░] 60k/200k | Opus 5.5 | main'] }],
  })
})

test('usage turns warning, then error, as the window fills', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, { percent: 60 })).toMatchObject({ children: [{ props: { color: 'warning' } }, { props: { dimColor: true } }] })
  expect(await drawAt($, { percent: 85 })).toMatchObject({ children: [{ props: { color: 'error' } }, { props: { dimColor: true } }] })
})

test('other modes stay ahead of the bar', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, { percent: 30, modes: ['focus', 'memory paused'], surface: 'desktop' })).toMatchObject({
    children: [{ props: { dimColor: true }, children: ['focus & memory paused & '] }, {}],
  })
})

test('a detached HEAD shows its short commit', async ($, on) => {
  answerHost(on, DETACHED)
  expect(await drawAt($, { percent: 30 })).toMatchObject({ children: [{ children: ['[███30%░░░░░░░] 60k/200k | Opus 5.5 | (abc1234)'] }] })
})

test('the session cost sits between usage and model', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, { percent: 30, costUsd: 0.42 })).toMatchObject({
    children: [{ props: { dimColor: true }, children: ['[███30%░░░░░░░] 60k/200k | $0.42 | Opus 5.5 | main'] }],
  })
})

test('the line fits what the terminal leaves beside the footer hints', async ($, on) => {
  answerHost(on, 'feature/OTOP-6363-mpdp-mpqa-test-image')
  const lineAt = (text: string) => ({ children: [{ children: [text] }] })
  expect(await drawAt($, { percent: 30, columns: 140 })).toMatchObject(
    lineAt('[███30%░░░░░░░] 60k/200k | Opus 5.5 | feature/OTOP-6363-mpdp-…'),
  )
  expect(await drawAt($, { percent: 30, columns: 100 })).toMatchObject(lineAt('[███30%░░░░░░░] 60k/200k | Opus 5.5'))
  expect(await drawAt($, { percent: 30, columns: 80 })).toMatchObject(lineAt('[███30%░░░░░░░] 60k/200k'))
})
