// sayg features: a pane with open and recently merged PRs, the migrations
// they carry, and for each one a researched insight, an improvement and a
// critique in one short sentence each. A click opens the PR's thread. The
// sentences come from sayg-pitch (insights mode), run by a background subagent on a
// strong model with web search; this view only reads what it wrote.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import type { Board, Insight, Migration } from '../types'
import { budgetMode, parseInsight } from './board'

// Session values, declared in each file that reads or writes them (the engine's
// state scan reads atoms from the file that uses them). Keep refs and shape
// tags identical to the other file's; change a tag when its type's fields change.
const board = atom({ plugin: 'spec-as-you-go', key: 'board' } as const, null, { shape: 'board-3' })
const ai = atom(
  { plugin: 'spec-as-you-go', key: 'ai' } as const,
  { skills: {}, windows: [], costUsd: null, contextPercent: null },
  { shape: 'ai-1' },
)
const refreshing = atom({ plugin: 'spec-as-you-go', key: 'refresh' } as const, { isLoading: false })
const insights = atom({ plugin: 'spec-as-you-go', key: 'insights' } as const, {}, { shape: 'insights-1' })
const generating = atom({ plugin: 'spec-as-you-go', key: 'generating' } as const, { prs: [], startedAt: 0 })

export const FEATURES_PANE = 'sayg-features'
export const FEATURES_TITLE = 'SAYG features'

const MAX_PER_RUN = 5
const POLL_MS = 20_000
const GIVE_UP_MS = 15 * 60 * 1000
const DEFAULT_MODEL = 'opus'

let poll: { cancel: () => void } | undefined

async function insightsDir($: EngineInterface): Promise<string> {
  return `${await $.session.cwd()}/.sayg/insights`
}

/** Reads every .sayg/insights/pr-<n>.json into the session state. */
export async function loadInsights($: EngineInterface): Promise<Record<string, Insight>> {
  const dir = await insightsDir($)
  const found: Record<string, Insight> = {}
  if (await $.fs.exists(dir)) {
    for (const entry of await $.fs.list(dir)) {
      if (entry.kind !== 'file' || !/^pr-\d+\.json$/.test(entry.name)) continue
      const parsed = parseInsight(await $.fs.read(`${dir}/${entry.name}`))
      if (parsed) found[String(parsed.pr)] = parsed
    }
  }
  await update($, insights, () => found)

  return found
}

/** The model insights run on: `.sayg/config.json` `insightModel`, else Opus. */
async function insightModel($: EngineInterface): Promise<string> {
  const path = `${await $.session.cwd()}/.sayg/config.json`
  if (!(await $.fs.exists(path))) return DEFAULT_MODEL
  try {
    const value = JSON.parse(await $.fs.read(path)).insightModel

    return typeof value === 'string' && value !== '' ? value : DEFAULT_MODEL
  } catch {
    return DEFAULT_MODEL
  }
}

/** PRs with no insight, or one written before their latest commit, newest first. */
export function missingInsights(current: Board, known: Record<string, Insight>): number[] {
  const rows = [
    ...current.prs.map(p => ({ number: p.number, sha: p.headSha })),
    ...current.merged.map(m => ({ number: m.number, sha: m.sha })),
  ]

  return rows
    .filter(r => {
      const found = known[String(r.number)]

      return !found || (found.sha !== '' && r.sha !== '' && found.sha !== r.sha)
    })
    .map(r => r.number)
}

export function insightPrompt(repo: string, prs: number[], lang: string): string {
  return [
    `Use the spec-as-you-go:sayg-pitch skill in insights mode on ${repo} for PRs ${prs.map(n => `#${n}`).join(', ')}.`,
    `For each PR, write .sayg/insights/pr-<number>.json as the skill describes, in ${lang}.`,
    'Read the project wiki (openwiki/) before the code, and research the web before writing.',
    'Do not change any other file, branch or PR.',
  ].join('\n')
}

export async function generate($: EngineInterface): Promise<string> {
  const current = await read($, board)
  if (!current) return 'Refresh first: there are no PRs loaded yet.'
  const running = await read($, generating)
  if (running.prs.length > 0) return `Already researching ${running.prs.map(n => `#${n}`).join(', ')}.`
  const mode = budgetMode((await read($, ai)).windows, await $.clock.now())
  if (mode === 'tight' || mode === 'exhausted') {
    return `Budget is ${mode}: insights paused. Run sayg-pitch in insights mode yourself when there is room.`
  }
  const prs = missingInsights(current, await read($, insights)).slice(0, MAX_PER_RUN)
  if (prs.length === 0) return 'Every PR already has a current insight.'
  const model = await insightModel($)
  const spawned = await $.agent.spawn({
    prompt: insightPrompt(current.repo, prs, 'the language of the builder profile, else Brazilian Portuguese'),
    description: 'SAYG insights',
    subagentType: 'general-purpose',
    model,
  })
  if (!spawned.agentId) return `Could not start the research: ${spawned.deny ?? 'refused'}`
  const startedAt = await $.clock.now()
  await update($, generating, () => ({ prs, startedAt }))
  poll?.cancel()
  poll = $.clock.every(POLL_MS, () => void checkProgress($))

  return `Researching ${prs.map(n => `#${n}`).join(', ')} on ${model}; the cards fill in as each finishes.`
}

async function checkProgress($: EngineInterface): Promise<void> {
  const known = await loadInsights($)
  const running = await read($, generating)
  const left = running.prs.filter(n => !known[String(n)])
  const isOver = left.length === 0 || (await $.clock.now()) - running.startedAt > GIVE_UP_MS
  if (isOver) {
    poll?.cancel()
    poll = undefined
    await update($, generating, () => ({ prs: [], startedAt: 0 }))
    if (left.length > 0) $.ui.toast(`SAYG insights: no answer for ${left.map(n => `#${n}`).join(', ')}`)
  } else if (left.length !== running.prs.length) {
    await update($, generating, () => ({ ...running, prs: left }))
  }
}

function migrationLabel(migration: Migration): string {
  return migration.kind === 'both' ? 'schema + contract' : migration.kind
}

export async function renderFeatures($: EngineInterface, e: RenderInput<'Pane'>, refresh: () => void) {
  const { Box, Text, Button, Link } = $.ui.resolve(e)
  const current = await read($, board)
  const known = await read($, insights)
  const state = await read($, refreshing)
  const running = await read($, generating)

  const missing = current ? missingInsights(current, known).length : 0
  const header = (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={1}>
        <Button key="refresh" onPress={refresh}>
          {state.isLoading ? 'Refreshing…' : 'Refresh'}
        </Button>
        <Button
          key="generate"
          variant="primary"
          onPress={async () => {
            $.ui.toast(await generate($))
          }}
        >
          {running.prs.length > 0
            ? `Researching ${running.prs.map(n => `#${n}`).join(' ')}…`
            : `Generate insights${missing > 0 ? ` (${Math.min(missing, MAX_PER_RUN)})` : ''}`}
        </Button>
      </Box>
      {state.error && <Text color="error">Last refresh failed: {state.error}</Text>}
    </Box>
  )
  if (!current) {
    return (
      <Box flexDirection="column">
        {header}
        <Text dimColor>loading…</Text>
      </Box>
    )
  }

  const pending = current.merged.filter(m => m.isPendingDeploy)
  const openMigrations = current.prs.filter(p => p.migration.kind !== 'none')

  const card = (key: string, number: number, title: string, url: string, status: string, sha: string, migration: Migration) => {
    const found = known[String(number)]
    const isOld = found && found.sha !== '' && sha !== '' && found.sha !== sha

    return (
      <Box key={key} flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Link href={url} label={`#${number} ${title}`} />
          <Text dimColor>{status}</Text>
          {migration.kind !== 'none' && <Text color="warning">{migrationLabel(migration)}</Text>}
        </Box>
        {found ? (
          <Box flexDirection="column">
            <Text>💡 {found.insight}</Text>
            <Text>🔧 {found.improvement}</Text>
            <Text>⚠️ {found.critique}</Text>
            {isOld && <Text dimColor>(written before the latest commit)</Text>}
          </Box>
        ) : (
          <Text dimColor>{running.prs.includes(number) ? 'researching…' : 'no insight yet'}</Text>
        )}
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1}>
      {header}
      <Text wrap="truncate-end">
        {current.repo} · {current.prs.length} open · {current.merged.length} merged in 14 days ·{' '}
        {pending.length + openMigrations.length} with migrations
      </Text>
      {pending.length + openMigrations.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Migrations</Text>
          {pending.map(m => (
            <Text key={`mig-m-${m.number}`} color="error" wrap="truncate-end">
              #{m.number} merged, not deployed yet{current.lastProductionDeployAt === null ? ' (no deploy data: check it ran)' : ''}:{' '}
              {m.migration.files.join(', ')}
            </Text>
          ))}
          {openMigrations.map(p => (
            <Text key={`mig-o-${p.number}`} color="warning" wrap="truncate-end">
              #{p.number} open, carries {migrationLabel(p.migration)}: {p.migration.files.join(', ')}
            </Text>
          ))}
        </Box>
      )}
      <Box flexDirection="column" gap={1}>
        <Text bold>Open</Text>
        {current.prs.length === 0 && <Text dimColor>No open pull requests.</Text>}
        {current.prs.map(p => card(`open-${p.number}`, p.number, p.title, p.threadUrl, p.action, p.headSha, p.migration))}
      </Box>
      <Box flexDirection="column" gap={1}>
        <Text bold>Merged (14 days)</Text>
        {current.merged.length === 0 && <Text dimColor>Nothing merged in the last 14 days.</Text>}
        {current.merged.map(m => card(`merged-${m.number}`, m.number, m.title, m.threadUrl, `merged ${m.mergedAt.slice(0, 10)}`, m.sha, m.migration))}
      </Box>
    </Box>
  )
}
