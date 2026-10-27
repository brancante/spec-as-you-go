// sayg board: a pane beside the chat with the open PRs in merge order, what
// each one needs next, recent deploys and the project's overall evolution.
// GitHub is read through `gh api` (REST), so it uses the person's own login.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Board, DeployRow, Evolution, PrState } from '../types'
import {
  countStates,
  glyph,
  order,
  parseRemote,
  statusLine,
  summarizeChecks,
  summarizeReviews,
  toText,
  type PrInput,
} from './board'

const PANE = 'sayg-board'
const TITLE = 'SAYG board'
const REFRESH_MS = 5 * 60 * 1000
// Commands after which the board is likely stale.
const CHANGES_PRS = /\b(git push|gh pr (create|merge|ready|close|review)|gh workflow run)\b/

// Change the tag when Board's fields change: it declines what an earlier
// version stored, which outlives a reload.
const board = atom({ plugin: 'spec-as-you-go', key: 'board' } as const, null, { shape: 'board-1' })
const refreshing = atom({ plugin: 'spec-as-you-go', key: 'refresh' } as const, { isLoading: false })

const COLOR: Record<PrState, 'success' | 'warning' | 'error' | 'inactive'> = {
  ready: 'success',
  waiting: 'warning',
  blocked: 'error',
  draft: 'inactive',
}

let isRunning = false

async function gh($: EngineInterface, path: string): Promise<any> {
  const ran = await $.process.run(['gh', 'api', path], { timeoutMs: 30_000 })
  if (ran.exitCode !== 0) {
    throw new Error(ran.stderr.trim().split('\n')[0] || `gh api ${path} failed`)
  }

  return JSON.parse(ran.stdout)
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  const worker = async () => {
    while (index < items.length) {
      const mine = index++
      results[mine] = await fn(items[mine] as T)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))

  return results
}

async function findRepo($: EngineInterface): Promise<string> {
  const ran = await $.process.run(['git', 'remote', 'get-url', 'origin'], { timeoutMs: 10_000 })
  const repo = ran.exitCode === 0 ? parseRemote(ran.stdout) : undefined
  if (!repo) throw new Error('No GitHub remote named origin in this folder')

  return repo
}

async function loadPr($: EngineInterface, repo: string, number: number): Promise<PrInput> {
  const [pull, reviews, files] = await Promise.all([
    gh($, `repos/${repo}/pulls/${number}`),
    gh($, `repos/${repo}/pulls/${number}/reviews?per_page=100`),
    gh($, `repos/${repo}/pulls/${number}/files?per_page=100`),
  ])
  const checks = await gh($, `repos/${repo}/commits/${pull.head.sha}/check-runs?per_page=100`)

  return {
    number,
    title: pull.title,
    url: pull.html_url,
    author: pull.user?.login ?? '',
    base: pull.base.ref,
    head: pull.head.ref,
    createdAt: pull.created_at,
    isDraft: pull.draft === true,
    mergeableState: pull.mergeable_state ?? 'unknown',
    ...summarizeChecks(checks.check_runs ?? []),
    ...summarizeReviews(reviews.map((r: any) => ({ user: r.user?.login ?? '', state: r.state }))),
    files: files.map((f: any) => f.filename),
  }
}

async function loadDeploys($: EngineInterface, repo: string, branch: string): Promise<DeployRow[]> {
  const deployments: any[] = await gh($, `repos/${repo}/deployments?per_page=5`)
  const rows = await mapLimit(deployments, 5, async d => {
    const [status] = await gh($, `repos/${repo}/deployments/${d.id}/statuses?per_page=1`)

    return {
      name: d.environment,
      state: status?.state ?? 'pending',
      ref: d.ref,
      at: status?.created_at ?? d.created_at,
      url: status?.target_url || status?.log_url || '',
    }
  })
  const runs = await gh($, `repos/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=3`)
  for (const run of runs.workflow_runs ?? []) {
    rows.push({
      name: `${branch}: ${run.name}`,
      state: run.conclusion ?? run.status,
      ref: run.head_sha.slice(0, 7),
      at: run.created_at,
      url: run.html_url,
    })
  }

  return rows
}

async function loadEvolution($: EngineInterface, repo: string, now: number): Promise<Evolution> {
  const cwd = await $.session.cwd()
  const stages: Record<string, number> = {}
  if (await $.fs.exists(`${cwd}/cells`)) {
    for (const entry of await $.fs.list(`${cwd}/cells`)) {
      const path = `${cwd}/cells/${entry.name}/cell.json`
      if (entry.kind !== 'dir' || !(await $.fs.exists(path))) continue
      const stage = String(JSON.parse(await $.fs.read(path)).stage ?? '?')
      stages[stage] = (stages[stage] ?? 0) + 1
    }
  }
  const slices: Record<string, number> = {}
  if (await $.fs.exists(`${cwd}/.sayg/slices`)) {
    for (const entry of await $.fs.list(`${cwd}/.sayg/slices`)) {
      if (!entry.name.endsWith('.md')) continue
      const text = await $.fs.read(`${cwd}/.sayg/slices/${entry.name}`)
      const status = text.match(/\*\*Status:\*\*\s*([a-z]+)/)?.[1] ?? 'unknown'
      slices[status] = (slices[status] ?? 0) + 1
    }
  }
  let discoveries = 0
  if (await $.fs.exists(`${cwd}/.sayg/discoveries.md`)) {
    discoveries = (await $.fs.read(`${cwd}/.sayg/discoveries.md`)).split('\n').filter(l => /^\s*[-*]\s+\S/.test(l)).length
  }
  const closed: any[] = await gh($, `repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=50`)
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const mergedLast7d = closed.filter(p => p.merged_at && Date.parse(p.merged_at) >= weekAgo).length

  return { stages, slices, discoveries, mergedLast7d }
}

async function refresh($: EngineInterface): Promise<Board | null> {
  if (isRunning) return (await read($, board)) ?? null
  isRunning = true
  await update($, refreshing, () => ({ isLoading: true }))
  try {
    const repo = await findRepo($)
    const meta = await gh($, `repos/${repo}`)
    const open: any[] = await gh($, `repos/${repo}/pulls?state=open&per_page=50`)
    const prs = await mapLimit(open, 4, pr => loadPr($, repo, pr.number))
    const now = await $.clock.now()
    const next: Board = {
      repo,
      refreshedAt: now,
      prs: order(prs),
      deploys: await loadDeploys($, repo, meta.default_branch),
      evolution: await loadEvolution($, repo, now),
    }
    await update($, board, () => next)
    await update($, refreshing, () => ({ isLoading: false }))
    $.ui.status(next.prs.length > 0 ? `PRs: ${statusLine(countStates(next.prs))}` : undefined)

    return next
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await update($, refreshing, () => ({ isLoading: false, error: message }))

    return (await read($, board)) ?? null
  } finally {
    isRunning = false
  }
}

function ago(now: number, at: number | string): string {
  const minutes = Math.max(0, Math.round((now - (typeof at === 'number' ? at : Date.parse(at))) / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)}h ago`

  return `${Math.round(minutes / 1440)}d ago`
}

function tally(counts: Record<string, number>): string {
  const keys = Object.keys(counts).sort()

  return keys.length > 0 ? keys.map(k => `${k} ${counts[k]}`).join(' · ') : 'none'
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'sayg-board',
      description: 'Open PRs in merge order, what each needs, deploys and project evolution',
    })
    // Open unasked only where the project uses Spec as you go.
    if (await $.fs.exists(`${await $.session.cwd()}/.sayg`)) void $.ui.open({ id: PANE, title: TITLE })
    void refresh($)
    $.clock.every(REFRESH_MS, () => void refresh($))

    return started
  })

  on('command.run', { command: 'sayg-board' }, async $ => {
    void $.ui.open({ id: PANE, title: TITLE })
    const current = await refresh($)
    const state = await read($, refreshing)
    if (!current) return { text: `SAYG board: ${state.error ?? 'nothing to show yet'}` }
    const warning = state.error ? `\n(last refresh failed: ${state.error}; showing the previous board)` : ''

    return { text: toText(current.repo, current.prs) + warning }
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (CHANGES_PRS.test(e.command)) $.clock.after(15_000, () => void refresh($))

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const current = await read($, board)
    const state = await read($, refreshing)
    const now = await $.clock.now()

    const header = (
      <Box flexDirection="row" gap={1}>
        <Button key="refresh" onPress={() => void refresh($)}>
          {state.isLoading ? 'Refreshing…' : 'Refresh'}
        </Button>
        <Text dimColor>
          {current ? `${current.repo} · ${ago(now, current.refreshedAt)}` : 'loading…'}
        </Text>
      </Box>
    )
    if (!current) {
      return (
        <Box flexDirection="column">
          {header}
          {state.error && <Text color="error">{state.error}</Text>}
        </Box>
      )
    }

    const { evolution } = current

    return (
      <Box flexDirection="column" gap={1}>
        {header}
        {state.error && <Text color="error">Last refresh failed: {state.error}</Text>}
        <Box flexDirection="column">
          <Text bold>
            Merge order · {current.prs.length > 0 ? statusLine(countStates(current.prs)) : 'no open PRs'}
          </Text>
          {current.prs.map((pr, i) => {
            const later = pr.overlaps.filter(o => current.prs.findIndex(r => r.number === o.number) > i)

            return (
              <Box key={`pr-${pr.number}`} flexDirection="column">
                <Box flexDirection="row" gap={1}>
                  <Text color={COLOR[pr.state]}>{glyph(pr.state)}</Text>
                  <Link href={pr.url} label={`${i + 1}. #${pr.number}`} />
                  <Text wrap="truncate-end">{pr.title}</Text>
                </Box>
                <Text dimColor wrap="truncate-end">
                  {'   '}
                  {pr.action}
                  {pr.after.length > 0 ? ` · after #${pr.after.join(', #')}` : ''}
                </Text>
                {later.length > 0 && (
                  <Text color="warning" wrap="truncate-end">
                    {'   '}shares files with {later.map(o => `#${o.number}`).join(', ')}: rebase them after this
                  </Text>
                )}
              </Box>
            )
          })}
        </Box>
        <Box flexDirection="column">
          <Text bold>Deploys</Text>
          {current.deploys.length === 0 && <Text dimColor>No deployments or workflow runs found.</Text>}
          {current.deploys.map(d => (
            <Text key={`${d.name}-${d.at}`} wrap="truncate-end">
              <Text color={/success|completed/.test(d.state) ? 'success' : /fail|error/.test(d.state) ? 'error' : 'warning'}>
                {d.state}
              </Text>{' '}
              {d.name} <Text dimColor>({d.ref}, {ago(now, d.at)})</Text>
            </Text>
          ))}
        </Box>
        <Box flexDirection="column">
          <Text bold>Evolution</Text>
          <Text>Cells by stage: {tally(evolution.stages)}</Text>
          <Text>Slices: {tally(evolution.slices)}</Text>
          <Text>
            Open discoveries: {evolution.discoveries} · PRs merged in 7 days: {evolution.mergedLast7d}
          </Text>
        </Box>
      </Box>
    )
  })
}
