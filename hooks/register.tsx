import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage } from 'claude-code'

import { formatStatus } from './format'

const GIT_TIMEOUT_MS = 1_000

const snapshot = atom({ plugin: 'context-bar', key: 'snapshot' } as const, null)

async function gitBranch($: EngineInterface): Promise<string | null> {
  try {
    const { exitCode, stdout } = await $.process.run(['git', 'branch', '--show-current'], {
      timeoutMs: GIT_TIMEOUT_MS,
    })
    return exitCode === 0 ? stdout.trim() || null : null
  } catch {
    return null
  }
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

  // SessionMode is the dim label slot at the right of the footer row
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const current = await read($, snapshot)
    if (current === null) {
      return next(e)
    }
    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, formatStatus(current)] } })
  })
}
