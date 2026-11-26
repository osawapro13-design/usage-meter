declare module 'claude-code' {
  interface PluginState {
    'usage-meter': { rows: { name: string; percent: number }[] }
  }
}
