import { expect, test } from 'claude-code/testing'

import { fillColor, formatStatus, formatTokens, renderBar, shortenBranch, shortenModel } from './format'

test('bar puts the percent at the fill edge', async () => {
  expect(renderBar(0)).toBe('[0%░░░░░░░░░░]')
  expect(renderBar(40)).toBe('[████40%░░░░░░]')
  expect(renderBar(100)).toBe('[██████████100%]')
  expect(renderBar(null)).toBe('[--%░░░░░░░░░░]')
})

test('tokens shorten to k and M', async () => {
  expect(formatTokens(512)).toBe('512')
  expect(formatTokens(58_400)).toBe('58k')
  expect(formatTokens(999_600)).toBe('1M')
  expect(formatTokens(1_000_000)).toBe('1M')
  expect(formatTokens(1_250_000)).toBe('1.3M')
})

test('color stays off until the window fills', async () => {
  expect(fillColor(null)).toBeUndefined()
  expect(fillColor(49)).toBeUndefined()
  expect(fillColor(50)).toBe('warning')
  expect(fillColor(79)).toBe('warning')
  expect(fillColor(80)).toBe('error')
})

test('long branch names keep their head', async () => {
  expect(shortenBranch('main')).toBe('main')
  expect(shortenBranch('feat/TPDX4-1426_abcdefgh')).toBe('feat/TPDX4-1426_abcdefgh')
  expect(shortenBranch('np/TPDX3-1804_record-postgres-lro-version')).toBe('np/TPDX3-1804_record-po…')
})

test('the model drops its claude- prefix', async () => {
  expect(shortenModel('claude-opus-5-5')).toBe('opus-5-5')
  expect(shortenModel('Opus 5.5')).toBe('Opus 5.5')
})

test('status colors usage alone and keeps the rest dim', async () => {
  const base = { percent: 6, tokens: 58_000, window: 1_000_000, model: 'Opus 5.5', rateLimits: [] }
  expect(formatStatus({ ...base, branch: 'main' })).toEqual([
    { text: '[█6%░░░░░░░░░] 58k/1M | Opus 5.5 | main', color: undefined },
  ])
  expect(formatStatus({ ...base, percent: 60, branch: null })).toEqual([
    { text: '[██████60%░░░░] 58k/1M', color: 'warning' },
    { text: ' | Opus 5.5', color: undefined },
  ])
  expect(formatStatus({ ...base, branch: 'feature/OTOP-6363-mpdp-mpqa-test-image' })[0]?.text).toBe(
    '[█6%░░░░░░░░░] 58k/1M | Opus 5.5 | feature/OTOP-6363-mpdp-…',
  )
  expect(formatStatus({ ...base, percent: null, tokens: null, branch: null })[0]?.text).toBe('[--%░░░░░░░░░░] -/1M | Opus 5.5')
})

test('rate-limit windows sit after usage, each colored by its fill', async () => {
  const base = { percent: 6, tokens: 58_000, window: 1_000_000, model: 'Opus 5.5', branch: null }
  const rateLimits = [
    { kind: 'five_hour', percentUsed: 23.5 },
    { kind: 'seven_day', percentUsed: 81 },
    { kind: 'other_window', percentUsed: 49.6 },
  ]
  expect(formatStatus({ ...base, rateLimits })).toEqual([
    { text: '[█6%░░░░░░░░░] 58k/1M | 5h 24% · ', color: undefined },
    { text: '7d 81%', color: 'error' },
    { text: ' · ', color: undefined },
    { text: 'other_window 50%', color: 'warning' },
    { text: ' | Opus 5.5', color: undefined },
  ])
})

test('narrow lines drop branch, then model, then limits, never usage', async () => {
  const snapshot = {
    percent: 6,
    tokens: 58_000,
    window: 1_000_000,
    model: 'Opus 5.5',
    branch: 'main',
    rateLimits: [{ kind: 'five_hour', percentUsed: 3 }],
  }
  const lineAt = (maxWidth: number) => formatStatus(snapshot, maxWidth).map(run => run.text).join('')
  expect(lineAt(47)).toBe('[█6%░░░░░░░░░] 58k/1M | 5h 3% | Opus 5.5 | main')
  expect(lineAt(46)).toBe('[█6%░░░░░░░░░] 58k/1M | 5h 3% | Opus 5.5')
  expect(lineAt(39)).toBe('[█6%░░░░░░░░░] 58k/1M | 5h 3%')
  expect(lineAt(28)).toBe('[█6%░░░░░░░░░] 58k/1M')
  expect(lineAt(0)).toBe('[█6%░░░░░░░░░] 58k/1M')
})
