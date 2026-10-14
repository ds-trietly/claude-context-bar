import type { ThemeKey } from 'claude-code'

import type { Snapshot } from '../types'

const BAR_WIDTH = 10
const FILLED_CHAR = '█'
const EMPTY_CHAR = '░'
const SEPARATOR = ' | '
const WARN_PERCENT = 50
const ALERT_PERCENT = 80

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
  const thousands = Math.round(count / 1_000)
  if (thousands < 1_000) {
    return `${thousands}k`
  }
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

// Undefined keeps the bar dim, so it only draws the eye once the window fills
export function fillColor(percent: number | null): ThemeKey | undefined {
  if (percent === null || percent < WARN_PERCENT) {
    return undefined
  }
  return percent < ALERT_PERCENT ? 'warning' : 'error'
}

// Usage is split from details so the drawing can color it alone
export function formatStatus(snapshot: Snapshot): { usage: string; details: string } {
  const used = snapshot.tokens === null ? '-' : formatTokens(snapshot.tokens)
  const parts = [snapshot.model]
  if (snapshot.branch !== null) {
    parts.push(snapshot.branch)
  }
  return {
    usage: `${renderBar(snapshot.percent)} ${used}/${formatTokens(snapshot.window)}`,
    details: `${SEPARATOR}${parts.join(SEPARATOR)}`,
  }
}
