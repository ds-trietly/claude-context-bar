// The fields of the engine's SessionRateLimit the bar draws
export type RateLimit = {
  kind: string
  percentUsed: number
}

export type Snapshot = {
  percent: number | null
  tokens: number | null
  window: number
  model: string
  branch: string | null
  rateLimits: RateLimit[]
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null }
  }
}
