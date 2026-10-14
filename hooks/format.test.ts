import { expect, test } from 'claude-code/testing'

import { fillColor, formatStatus, formatTokens, renderBar } from './format'

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

test('status splits usage from model and branch', async () => {
  const base = { percent: 6, tokens: 58_000, window: 1_000_000, model: 'Opus 5.5' }
  expect(formatStatus({ ...base, branch: 'main' })).toEqual({
    usage: '[█6%░░░░░░░░░] 58k/1M',
    details: ' | Opus 5.5 | main',
  })
  expect(formatStatus({ ...base, branch: null }).details).toBe(' | Opus 5.5')
  expect(formatStatus({ ...base, percent: null, tokens: null, branch: null }).usage).toBe('[--%░░░░░░░░░░] -/1M')
})
