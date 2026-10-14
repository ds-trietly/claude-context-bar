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

async function drawAt($: Engine, percent: number, modes: string[] = [], surface: RenderSurface = 'terminal') {
  await $.session.measure({
    context: { tokens: (WINDOW * percent) / 100, window: WINDOW, percent },
    rateLimits: [],
    changed: ['context'],
  })
  const ui = await $.ui.mount({ plugin: 'context-bar', surface, component: 'SessionMode', props: { modes } })
  return ui.drawn()
}

test('usage stays dim below the warning level', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, 30)).toMatchObject({
    type: 'Text',
    children: [
      { type: 'Text', props: { dimColor: true }, children: ['[███30%░░░░░░░] 60k/200k'] },
      { type: 'Text', props: { dimColor: true }, children: [' | Opus 5.5 | main'] },
    ],
  })
})

test('usage turns warning, then error, as the window fills', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, 60)).toMatchObject({ children: [{ props: { color: 'warning' } }, { props: { dimColor: true } }] })
  expect(await drawAt($, 85)).toMatchObject({ children: [{ props: { color: 'error' } }, { props: { dimColor: true } }] })
})

test('other modes stay ahead of the bar', async ($, on) => {
  answerHost(on, 'main')
  expect(await drawAt($, 30, ['focus', 'memory paused'], 'desktop')).toMatchObject({
    children: [{ props: { dimColor: true }, children: ['focus & memory paused & '] }, {}, {}],
  })
})

test('a detached HEAD shows its short commit', async ($, on) => {
  answerHost(on, DETACHED)
  expect(await drawAt($, 30)).toMatchObject({ children: [{}, { children: [' | Opus 5.5 | (abc1234)'] }] })
})
