import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

const rows = atom({ plugin: 'usage-meter', key: 'rows' } as const, [])

const names: Record<string, string> = { five_hour: '5時間', seven_day: '週' }

const bar = (percent: number): string => {
  const filled = Math.max(0, Math.min(10, Math.round(percent / 10)))
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

const toRows = (limits: SessionRateLimit[]) =>
  limits.map(l => ({ name: names[l.kind] ?? l.kind, percent: l.percentUsed }))

const toText = (list: { name: string; percent: number }[]): string =>
  list
    .map(r => `${r.name} ${bar(r.percent)} ${Math.round(r.percent)}%${r.percent >= 80 ? ' ⚠' : ''}`)
    .join('  ')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const list = toRows((await $.session.usage()).rateLimits)
    $.ui.status(list.length === 0 ? undefined : `使用率 ${toText(list)}`)
    await update($, rows, () => list)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const list = toRows(e.rateLimits)
    $.ui.status(list.length === 0 ? undefined : `使用率 ${toText(list)}`)
    await update($, rows, () => list)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, rows)
    if (e.props.hasSurvey || list.length === 0) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor>使用率: </Text>
        {list.map(r => (
          <Text
            key={r.name}
            color={r.percent >= 80 ? '#ef4444' : r.percent >= 60 ? '#eab308' : '#3b82f6'}
          >
            {r.name} {bar(r.percent)} {Math.round(r.percent)}%{r.percent >= 80 ? ' ⚠' : ''}
            {'  '}
          </Text>
        ))}
      </Box>
    )
  })
}
