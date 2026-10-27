// sayg board: a pane beside the chat with the open PRs in merge order and
// what each needs next, code health and security, delivery flow, and the
// session's AI picture (skills used, plan windows, cost). GitHub is read
// through `gh api` (REST), so it uses the person's own login.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Ai, Board, DeployRow, Evolution, PrState, Security, Severity, Sonar, Tab } from '../types'
import {
  budgetMode,
  ciHealth,
  cycleHours,
  glyph,
  headline,
  order,
  parseRemote,
  severityCounts,
  severityText,
  STALE_DAYS,
  summarizeChecks,
  summarizeReviews,
  toText,
  windowLabel,
  type PrInput,
} from './board'

const PANE = 'sayg-board'
const TITLE = 'SAYG board'
const REFRESH_MS = 5 * 60 * 1000
// Commands after which the board is likely stale.
const CHANGES_PRS = /\b(git push|gh pr (create|merge|ready|close|review)|gh workflow run)\b/

// Change a tag when its type's fields change: it declines what an earlier
// version stored, which outlives a reload.
const board = atom({ plugin: 'spec-as-you-go', key: 'board' } as const, null, { shape: 'board-2' })
const ai = atom(
  { plugin: 'spec-as-you-go', key: 'ai' } as const,
  { skills: {}, windows: [], costUsd: null, contextPercent: null },
  { shape: 'ai-1' },
)
const refreshing = atom({ plugin: 'spec-as-you-go', key: 'refresh' } as const, { isLoading: false })
const tab = atom({ plugin: 'spec-as-you-go', key: 'tab' } as const, 'prs')

const TABS: { id: Tab; label: string; hotkey: string }[] = [
  { id: 'prs', label: 'PRs', hotkey: '1' },
  { id: 'health', label: 'Health', hotkey: '2' },
  { id: 'flow', label: 'Flow', hotkey: '3' },
  { id: 'ai', label: 'AI', hotkey: '4' },
]

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

/** For endpoints a repo may have switched off or the login may not see: null instead of an error. */
async function ghOrNull($: EngineInterface, path: string): Promise<any> {
  try {
    return await gh($, path)
  } catch {
    return null
  }
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
    updatedAt: pull.updated_at,
    isDraft: pull.draft === true,
    mergeableState: pull.mergeable_state ?? 'unknown',
    ...summarizeChecks(checks.check_runs ?? []),
    ...summarizeReviews(reviews.map((r: any) => ({ user: r.user?.login ?? '', state: r.state }))),
    requestedReviewers: (pull.requested_reviewers ?? []).map((u: any) => u.login),
    files: files.map((f: any) => f.filename),
  }
}

async function loadDeploys($: EngineInterface, repo: string, branch: string, runs: any[]): Promise<DeployRow[]> {
  const deployments: any[] = (await ghOrNull($, `repos/${repo}/deployments?per_page=5`)) ?? []
  const rows = await mapLimit(deployments, 5, async d => {
    const [status] = (await ghOrNull($, `repos/${repo}/deployments/${d.id}/statuses?per_page=1`)) ?? []

    return {
      name: d.environment,
      state: status?.state ?? 'pending',
      ref: d.ref,
      at: status?.created_at ?? d.created_at,
      url: status?.target_url || status?.log_url || '',
    }
  })
  for (const run of runs.slice(0, 3)) {
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

/** The newest sonar-report artifact that sayg-sonar uploaded, downloaded once per run. */
async function loadSonar($: EngineInterface, repo: string, previous: Sonar | null): Promise<Sonar | null> {
  const found = await ghOrNull($, `repos/${repo}/actions/artifacts?name=sonar-report&per_page=1`)
  const artifact = found?.artifacts?.[0]
  if (!artifact || artifact.expired) return null
  const runId: number = artifact.workflow_run?.id
  if (previous && previous.runId === runId) return previous
  const tmp = await $.process.run(['mktemp', '-d'], { timeoutMs: 10_000 })
  const dir = tmp.stdout.trim()
  const ran = await $.process.run(
    ['gh', 'run', 'download', String(runId), '-n', 'sonar-report', '-D', dir, '-R', repo],
    { timeoutMs: 60_000 },
  )
  if (ran.exitCode !== 0 || !(await $.fs.exists(`${dir}/sonar-report.json`))) return null
  const report = JSON.parse(await $.fs.read(`${dir}/sonar-report.json`))
  await $.process.run(['rm', '-rf', dir], { timeoutMs: 10_000 })

  return {
    runId,
    at: report.date ?? artifact.created_at,
    url: `https://github.com/${repo}/actions/runs/${runId}`,
    gate: report.quality_gate ?? 'NONE',
    severeOpen: report.severe_open ?? 0,
    securityOpen: report.security_open ?? 0,
    hotspots: report.hotspots_to_review ?? 0,
    measures: report.measures ?? {},
  }
}

async function loadSecurity($: EngineInterface, repo: string): Promise<Security> {
  const [dependabot, codeScanning, secrets] = await Promise.all([
    ghOrNull($, `repos/${repo}/dependabot/alerts?state=open&per_page=100`),
    ghOrNull($, `repos/${repo}/code-scanning/alerts?state=open&per_page=100`),
    ghOrNull($, `repos/${repo}/secret-scanning/alerts?state=open&per_page=100`),
  ])

  return {
    dependabot: Array.isArray(dependabot)
      ? severityCounts(dependabot.map((a: any) => a.security_vulnerability?.severity ?? a.security_advisory?.severity))
      : null,
    codeScanning: Array.isArray(codeScanning)
      ? severityCounts(codeScanning.map((a: any) => a.rule?.security_severity_level ?? a.rule?.severity))
      : null,
    secretScanning: Array.isArray(secrets) ? secrets.length : null,
  }
}

async function loadEvolution($: EngineInterface): Promise<Evolution> {
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

  return { stages, slices, discoveries }
}

async function refreshAi($: EngineInterface): Promise<void> {
  const usage = await $.session.usage()
  await update($, ai, current => ({
    skills: current.skills,
    windows: usage.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })),
    costUsd: usage.cost?.usd ?? null,
    contextPercent: usage.context.percent ?? null,
  }))
}

async function refresh($: EngineInterface): Promise<Board | null> {
  if (isRunning) return (await read($, board)) ?? null
  isRunning = true
  await update($, refreshing, () => ({ isLoading: true }))
  try {
    await refreshAi($).catch(() => undefined)
    const repo = await findRepo($)
    const previous = (await read($, board)) ?? null
    const [meta, me, open, closed] = await Promise.all([
      gh($, `repos/${repo}`),
      ghOrNull($, 'user'),
      gh($, `repos/${repo}/pulls?state=open&per_page=50`) as Promise<any[]>,
      gh($, `repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=50`) as Promise<any[]>,
    ])
    const login: string = me?.login ?? ''
    const now = await $.clock.now()
    const prs = order(await mapLimit(open, 4, pr => loadPr($, repo, pr.number)), login, now)
    const runs: any[] =
      (await ghOrNull($, `repos/${repo}/actions/runs?branch=${encodeURIComponent(meta.default_branch)}&per_page=20`))
        ?.workflow_runs ?? []
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const merged = closed
      .filter(p => p.merged_at && Date.parse(p.merged_at) >= weekAgo)
      .map(p => ({ createdAt: p.created_at, mergedAt: p.merged_at }))
    const [deploys, sonar, security, evolution] = await Promise.all([
      loadDeploys($, repo, meta.default_branch, runs),
      loadSonar($, repo, previous?.sonar ?? null).catch(() => previous?.sonar ?? null),
      loadSecurity($, repo),
      loadEvolution($),
    ])
    const next: Board = {
      repo,
      me: login,
      refreshedAt: now,
      prs,
      deploys,
      evolution,
      sonar,
      ci: ciHealth(
        runs.map(r => ({ status: r.status, conclusion: r.conclusion, startedAt: r.run_started_at, updatedAt: r.updated_at })),
      ),
      security,
      flow: {
        mergedLast7d: merged.length,
        medianCycleHours: cycleHours(merged),
        stale: prs.filter(p => p.isStale).length,
        reviewsForMe: prs.filter(p => p.needsMyReview).length,
      },
    }
    await update($, board, () => next)
    await update($, refreshing, () => ({ isLoading: false }))
    $.ui.status(headline(next, await read($, ai)) || undefined)

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

function until(now: number, at: string | undefined): string {
  if (!at) return ''
  const minutes = Math.max(0, Math.round((Date.parse(at) - now) / 60_000))
  if (minutes < 60) return `resets in ${minutes}m`
  if (minutes < 48 * 60) return `resets in ${Math.round(minutes / 60)}h`

  return `resets in ${Math.round(minutes / 1440)}d`
}

function tally(counts: Record<string, number>): string {
  const keys = Object.keys(counts).sort()

  return keys.length > 0 ? keys.map(k => `${k} ${counts[k]}`).join(' · ') : 'none'
}

function severityColor(counts: Severity | null): 'success' | 'warning' | 'error' | 'inactive' {
  if (counts === null) return 'inactive'
  if (counts.critical + counts.high > 0) return 'error'

  return counts.medium + counts.low > 0 ? 'warning' : 'success'
}

function bar(percent: number, width = 20): string {
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)))

  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'sayg-board',
      description: 'PR merge order and next actions, code health, security, flow and AI usage',
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

    return { text: toText(current, await read($, ai), await $.clock.now()) + warning }
  })

  on('skill.prompt', async ($, e, next) => {
    const name = e.pluginName ? `${e.pluginName}:${e.skill}` : e.skill
    await update($, ai, current => ({ ...current, skills: { ...current.skills, [name]: (current.skills[name] ?? 0) + 1 } }))

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    void refreshAi($).catch(() => undefined)

    return done
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (CHANGES_PRS.test(e.command)) $.clock.after(15_000, () => void refresh($))

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const current = await read($, board)
    const session = await read($, ai)
    const state = await read($, refreshing)
    const selected = await read($, tab)
    const now = await $.clock.now()

    const top = (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Button key="refresh" onPress={() => void refresh($)}>
            {state.isLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Text dimColor wrap="truncate-end">
            {current ? `${current.repo} · ${ago(now, current.refreshedAt)}` : 'loading…'}
          </Text>
        </Box>
        <Text wrap="truncate-end">{headline(current, session) || ' '}</Text>
        {state.error && <Text color="error">Last refresh failed: {state.error}</Text>}
        <Box flexDirection="row" gap={1}>
          {TABS.map(t => (
            <Button
              key={`tab-${t.id}`}
              hotkey={t.hotkey}
              variant={selected === t.id ? 'primary' : 'secondary'}
              onPress={() => void update($, tab, () => t.id)}
            >
              {t.label}
            </Button>
          ))}
        </Box>
      </Box>
    )

    if (selected === 'ai') {
      const skills = Object.entries(session.skills).sort((a, b) => b[1] - a[1])

      return (
        <Box flexDirection="column" gap={1}>
          {top}
          <Box flexDirection="column">
            <Text bold>Plan windows · budget mode {budgetMode(session.windows, now)}</Text>
            {session.windows.length === 0 && <Text dimColor>Not reported for this session (API key or gateway).</Text>}
            {session.windows.map(w => (
              <Text key={`win-${w.kind}`}>
                {windowLabel(w.kind).padEnd(3)}{' '}
                <Text color={w.percentUsed >= 85 ? 'error' : w.percentUsed >= 60 ? 'warning' : 'success'}>
                  {bar(w.percentUsed)}
                </Text>{' '}
                {Math.round(w.percentUsed)}% <Text dimColor>{until(now, w.resetsAt)}</Text>
              </Text>
            ))}
          </Box>
          <Box flexDirection="column">
            <Text bold>This session</Text>
            <Text>
              Cost: {session.costUsd === null ? 'n/a' : `$${session.costUsd.toFixed(2)}`} · Context used:{' '}
              {session.contextPercent === null ? 'n/a' : `${session.contextPercent}%`}
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Skills used this session</Text>
            {skills.length === 0 && <Text dimColor>None yet.</Text>}
            {skills.map(([name, count]) => (
              <Text key={`skill-${name}`} wrap="truncate-end">
                {count}× {name}
              </Text>
            ))}
          </Box>
        </Box>
      )
    }

    if (!current) return top

    if (selected === 'health') {
      const sonar = current.sonar
      const m = sonar?.measures ?? {}

      return (
        <Box flexDirection="column" gap={1}>
          {top}
          <Box flexDirection="column">
            <Text bold>Code quality</Text>
            {sonar ? (
              <Box flexDirection="column">
                <Box flexDirection="row" gap={1}>
                  <Text color={sonar.gate === 'OK' ? 'success' : sonar.gate === 'ERROR' ? 'error' : 'warning'}>
                    Gate {sonar.gate}
                  </Text>
                  <Link href={sonar.url} label={`Sonar · ${ago(now, sonar.at)}`} />
                </Box>
                <Text>
                  Coverage {m.coverage ?? 'n/a'}% · Duplication {m.duplicated_lines_density ?? 'n/a'}% · {m.ncloc ?? '?'} lines
                </Text>
                <Text color={sonar.severeOpen > 0 ? 'error' : 'success'}>BLOCKER/HIGH open: {sonar.severeOpen}</Text>
              </Box>
            ) : (
              <Text dimColor>No sayg-sonar report yet (set up with sayg-pipeline).</Text>
            )}
            <Text>
              CI on default branch:{' '}
              {current.ci.passRate === null ? (
                'no runs'
              ) : (
                <Text color={current.ci.passRate >= 90 ? 'success' : current.ci.passRate >= 70 ? 'warning' : 'error'}>
                  {current.ci.passRate}% pass
                </Text>
              )}
              {current.ci.passRate !== null && ` over ${current.ci.runs} runs · median ${current.ci.medianMinutes?.toFixed(1)} min`}
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Security</Text>
            <Text>
              Dependabot: <Text color={severityColor(current.security.dependabot)}>{severityText(current.security.dependabot)}</Text>
            </Text>
            <Text>
              Code scanning:{' '}
              <Text color={severityColor(current.security.codeScanning)}>{severityText(current.security.codeScanning)}</Text>
            </Text>
            <Text>
              Secret scanning:{' '}
              <Text color={current.security.secretScanning ? 'error' : current.security.secretScanning === 0 ? 'success' : 'inactive'}>
                {current.security.secretScanning === null ? 'n/a' : `${current.security.secretScanning} open`}
              </Text>
            </Text>
            {sonar && (
              <Text>
                Sonar: {sonar.securityOpen} security issues · {sonar.hotspots} hotspots to review
              </Text>
            )}
            <Text dimColor>n/a: feature off for this repo or your login can't read it.</Text>
          </Box>
        </Box>
      )
    }

    if (selected === 'flow') {
      const { evolution, flow } = current

      return (
        <Box flexDirection="column" gap={1}>
          {top}
          <Box flexDirection="column">
            <Text bold>Delivery flow</Text>
            <Text>
              Merged in 7 days: {flow.mergedLast7d} · Median open→merge:{' '}
              {flow.medianCycleHours === null ? 'n/a' : `${flow.medianCycleHours} h`}
            </Text>
            <Text color={flow.stale > 0 ? 'warning' : undefined}>
              Stale PRs ({STALE_DAYS}+ days without update): {flow.stale}
            </Text>
            <Text color={flow.reviewsForMe > 0 ? 'warning' : undefined}>Waiting for your review: {flow.reviewsForMe}</Text>
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
            <Text>Open discoveries: {evolution.discoveries}</Text>
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        {top}
        <Box flexDirection="column">
          <Text bold>Merge order</Text>
          {current.prs.length === 0 && <Text dimColor>No open pull requests.</Text>}
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
                  {pr.isStale ? ' · stale' : ''}
                  {pr.needsMyReview ? ' · your review' : ''}
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
      </Box>
    )
  })
}
