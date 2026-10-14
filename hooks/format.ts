import type { Snapshot } from '../types'

const BAR_WIDTH = 10
const FILLED_CHAR = '█'
const EMPTY_CHAR = '░'
const SEPARATOR = ' | '

// The percent sits at the fill edge so it hides no cells
export function renderBar(percent: number | null): string {
  const filled = percent === null ? 0 : Math.round((percent / 100) * BAR_WIDTH)
  const label = percent === null ? '--%' : `${percent}%`
  return `[${FILLED_CHAR.repeat(filled)}${label}${EMPTY_CHAR.repeat(BAR_WIDTH - filled)}]`
}

export function formatTokens(count: number): string {
  if (count < 1_000) {
    return String(count)
  }
  if (count < 1_000_000) {
    return `${Math.round(count / 1_000)}k`
  }
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

export function formatStatus(snapshot: Snapshot): string {
  const used = snapshot.tokens === null ? '-' : formatTokens(snapshot.tokens)
  const parts = [`${renderBar(snapshot.percent)} ${used}/${formatTokens(snapshot.window)}`, snapshot.model]
  if (snapshot.branch !== null) {
    parts.push(snapshot.branch)
  }
  return parts.join(SEPARATOR)
}
