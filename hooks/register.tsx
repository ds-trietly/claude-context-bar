import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage } from 'claude-code'

import { fillColor, formatStatus } from './format'

const GIT_TIMEOUT_MS = 1_000
// How the engine joins the footer's mode labels
const MODE_SEPARATOR = ' & '

const snapshot = atom({ plugin: 'context-bar', key: 'snapshot' } as const, null)

async function git($: EngineInterface, args: string[]): Promise<string | null> {
  try {
    const { exitCode, stdout } = await $.process.run(['git', ...args], { timeoutMs: GIT_TIMEOUT_MS })
    return exitCode === 0 ? stdout.trim() || null : null
  } catch {
    return null
  }
}

// A detached HEAD (rebase, bisect) has no branch, so name the commit instead
async function gitBranch($: EngineInterface): Promise<string | null> {
  const branch = await git($, ['branch', '--show-current'])
  if (branch !== null) {
    return branch
  }
  const commit = await git($, ['rev-parse', '--short', 'HEAD'])
  return commit === null ? null : `(${commit})`
}

async function refresh($: EngineInterface, context: SessionContextUsage): Promise<void> {
  const [model, branch] = await Promise.all([$.session.model(), gitBranch($)])
  await update($, snapshot, () => ({
    percent: context.percent ?? null,
    tokens: context.tokens ?? null,
    window: context.window,
    model,
    branch,
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const { context } = await $.session.usage()
    await refresh($, context)
    return result
  })

  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    await refresh($, e.context)
    return result
  })

  // SessionMode is the dim label slot at the right of the footer row; drawing
  // it ourselves lets the usage part take a color while the rest stays dim
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const current = await read($, snapshot)
    if (current === null) {
      return next(e)
    }
    const { Text } = $.ui.resolve(e)
    const { usage, details } = formatStatus(current)
    const color = fillColor(current.percent)
    const usageStyle = color === undefined ? { dimColor: true } : { color }
    const otherModes = e.props.modes.map(mode => `${mode}${MODE_SEPARATOR}`).join('')
    return (
      <Text>
        {otherModes === '' ? null : <Text dimColor>{otherModes}</Text>}
        <Text {...usageStyle}>{usage}</Text>
        <Text dimColor>{details}</Text>
      </Text>
    )
  })
}
