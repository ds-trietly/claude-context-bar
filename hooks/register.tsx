import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import { formatStatus } from './format'
import type { Run } from './format'

const GIT_TIMEOUT_MS = 1_000
// How the engine joins the footer's mode labels
const MODE_SEPARATOR = ' & '

function runStyle(run: Run): { color: Run['color'] } | { dimColor: true } {
  return run.color === undefined ? { dimColor: true } : { color: run.color }
}

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

async function refresh(
  $: EngineInterface,
  { context, rateLimits }: Pick<SessionUsage, 'context' | 'rateLimits'>,
): Promise<void> {
  const [model, branch] = await Promise.all([$.session.model(), gitBranch($)])
  await update($, snapshot, () => ({
    percent: context.percent ?? null,
    tokens: context.tokens ?? null,
    window: context.window,
    model,
    branch,
    rateLimits,
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($, await $.session.usage())
    return result
  })

  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    await refresh($, e)
    return result
  })

  // SessionMode is the dim label slot at the right of the footer row; drawing
  // it ourselves lets parts of the line take a color while the rest stays dim
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const current = await read($, snapshot)
    if (current === null) {
      return next(e)
    }
    const { Text } = $.ui.resolve(e)
    const otherModes = e.props.modes.map(mode => `${mode}${MODE_SEPARATOR}`).join('')
    return (
      <Text>
        {otherModes === '' ? null : <Text dimColor>{otherModes}</Text>}
        {formatStatus(current).map(run => (
          <Text {...runStyle(run)}>{run.text}</Text>
        ))}
      </Text>
    )
  })
}
