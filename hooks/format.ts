import type { ThemeKey } from 'claude-code'

import type { Snapshot } from '../types'

const BAR_WIDTH = 10
const FILLED_CHAR = '█'
const EMPTY_CHAR = '░'
const SEPARATOR = ' | '
const WARN_PERCENT = 50
const ALERT_PERCENT = 80
const MAX_BRANCH_LENGTH = 24
const ELLIPSIS = '…'
const MODEL_PREFIX = 'claude-'

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

// A branch name's head carries its type and ticket, so the tail is cut
export function shortenBranch(branch: string): string {
  if (branch.length <= MAX_BRANCH_LENGTH) {
    return branch
  }
  return `${branch.slice(0, MAX_BRANCH_LENGTH - ELLIPSIS.length)}${ELLIPSIS}`
}

export function shortenModel(model: string): string {
  return model.startsWith(MODEL_PREFIX) ? model.slice(MODEL_PREFIX.length) : model
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`
}

// A stretch of the line in one color; undefined draws it dim
export type Run = { text: string; color: ThemeKey | undefined }

function dim(text: string): Run {
  return { text, color: undefined }
}

// Adjacent runs of one color draw as one Text
function mergeRuns(runs: Run[]): Run[] {
  const merged: Run[] = []
  for (const run of runs) {
    const last = merged.at(-1)
    if (last !== undefined && last.color === run.color) {
      last.text += run.text
    } else {
      merged.push({ ...run })
    }
  }
  return merged
}

function lineWidth(segments: Run[]): number {
  const textWidth = segments.reduce((sum, segment) => sum + segment.text.length, 0)
  return textWidth + SEPARATOR.length * (segments.length - 1)
}

// Segments drop from the end until the line fits maxWidth; usage always stays
export function formatStatus(snapshot: Snapshot, maxWidth = Infinity): Run[] {
  const used = snapshot.tokens === null ? '-' : formatTokens(snapshot.tokens)
  const usage = `${renderBar(snapshot.percent)} ${used}/${formatTokens(snapshot.window)}`
  const segments: Run[] = [{ text: usage, color: fillColor(snapshot.percent) }]
  if (snapshot.costUsd !== null) {
    segments.push(dim(formatCost(snapshot.costUsd)))
  }
  segments.push(dim(shortenModel(snapshot.model)))
  if (snapshot.branch !== null) {
    segments.push(dim(shortenBranch(snapshot.branch)))
  }
  while (segments.length > 1 && lineWidth(segments) > maxWidth) {
    segments.pop()
  }
  return mergeRuns(segments.flatMap((segment, index) => (index === 0 ? [segment] : [dim(SEPARATOR), segment])))
}
