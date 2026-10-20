export type Snapshot = {
  percent: number | null
  tokens: number | null
  window: number
  model: string
  branch: string | null
  costUsd: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null }
  }
}
