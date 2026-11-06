// Pure logic of the sayg board: what each PR needs next, the order to merge
// them in, and the health, flow and AI summaries. No `$` here, so it is
// tested on its own.
import type { Ai, Board, BudgetMode, CiHealth, DeployRow, Insight, Migration, PrRow, PrState, Severity, Window } from '../types'

export type PrInput = {
  number: number
  title: string
  url: string
  author: string
  base: string
  head: string
  createdAt: string
  updatedAt: string
  isDraft: boolean
  /** GitHub's mergeable_state: clean, dirty, behind, blocked, unstable, has_hooks, draft, unknown. */
  mergeableState: string
  failedChecks: string[]
  pendingChecks: number
  isApproved: boolean
  hasChangesRequested: boolean
  requestedReviewers: string[]
  files: string[]
  body: string
  headSha: string
}

const RANK: Record<PrState, number> = { ready: 0, waiting: 1, blocked: 2, draft: 3 }

const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure'])

const DAY_MS = 24 * 60 * 60 * 1000

export const STALE_DAYS = 5

export function summarizeChecks(runs: { name: string; status: string; conclusion: string | null }[]) {
  const failedChecks = runs.filter(r => r.conclusion !== null && FAILED.has(r.conclusion)).map(r => r.name)
  const pendingChecks = runs.filter(r => r.status !== 'completed').length

  return { failedChecks: [...new Set(failedChecks)], pendingChecks }
}

/** Latest review per reviewer decides; a later approval clears an earlier change request. */
export function summarizeReviews(reviews: { user: string; state: string }[]) {
  const latest = new Map<string, string>()
  for (const review of reviews) {
    if (review.state === 'APPROVED' || review.state === 'CHANGES_REQUESTED' || review.state === 'DISMISSED') {
      latest.set(review.user, review.state)
    }
  }
  const states = [...latest.values()]

  return {
    isApproved: states.includes('APPROVED') && !states.includes('CHANGES_REQUESTED'),
    hasChangesRequested: states.includes('CHANGES_REQUESTED'),
  }
}

export function classify(pr: PrInput): { state: PrState; action: string } {
  if (pr.isDraft || pr.mergeableState === 'draft') return { state: 'draft', action: 'Mark ready for review (draft)' }
  if (pr.mergeableState === 'dirty') return { state: 'blocked', action: `Resolve conflicts with ${pr.base}` }
  if (pr.failedChecks.length > 0) {
    const names = pr.failedChecks.slice(0, 3).join(', ')
    const more = pr.failedChecks.length > 3 ? ` +${pr.failedChecks.length - 3}` : ''

    return { state: 'blocked', action: `Fix CI: ${names}${more}` }
  }
  if (pr.hasChangesRequested) return { state: 'blocked', action: 'Address requested changes' }
  if (pr.pendingChecks > 0) return { state: 'waiting', action: `Wait for checks (${pr.pendingChecks} running)` }
  if (pr.mergeableState === 'behind') return { state: 'waiting', action: `Update branch with ${pr.base}` }
  if (pr.mergeableState === 'blocked') {
    return { state: 'waiting', action: pr.isApproved ? 'Blocked by a branch rule' : 'Get a review' }
  }
  if (pr.mergeableState === 'unknown' || pr.mergeableState === '') {
    return { state: 'waiting', action: 'GitHub is still computing mergeability' }
  }

  return { state: 'ready', action: pr.mergeableState === 'unstable' ? 'Merge (optional checks failing)' : 'Merge' }
}

/**
 * Merge order: a PR stacked on another's branch goes after it; among the
 * rest, ready before waiting before blocked before draft, then oldest first.
 */
export function order(prs: PrInput[], me = '', now = Date.now()): PrRow[] {
  const byHead = new Map(prs.map(pr => [pr.head, pr]))
  const rows = new Map<number, PrRow>()
  for (const pr of prs) {
    const { state, action } = classify(pr)
    const parent = byHead.get(pr.base)
    const overlaps = prs
      .filter(other => other.number !== pr.number)
      .map(other => ({ number: other.number, files: other.files.filter(f => pr.files.includes(f)).length }))
      .filter(o => o.files > 0)
    rows.set(pr.number, {
      number: pr.number,
      title: pr.title,
      url: pr.url,
      author: pr.author,
      base: pr.base,
      head: pr.head,
      createdAt: pr.createdAt,
      state,
      action,
      after: parent && parent.number !== pr.number ? [parent.number] : [],
      overlaps,
      isStale: now - Date.parse(pr.updatedAt) >= STALE_DAYS * DAY_MS,
      needsMyReview: me !== '' && pr.requestedReviewers.includes(me),
      threadUrl: threadUrl(pr.body, pr.url),
      headSha: pr.headSha,
      migration: migrationOf(pr.files),
    })
  }

  const compare = (a: PrRow, b: PrRow) =>
    RANK[a.state] - RANK[b.state] || a.createdAt.localeCompare(b.createdAt) || a.number - b.number
  const done = new Set<number>()
  const result: PrRow[] = []
  let pending = [...rows.values()]
  while (pending.length > 0) {
    const free = pending.filter(row => row.after.every(n => done.has(n) || !rows.has(n)))
    // A cycle of stacked branches can't be ordered; take the rest as they rank.
    const next = (free.length > 0 ? free : pending).sort(compare)[0]
    if (!next) break
    result.push(next)
    done.add(next.number)
    pending = pending.filter(row => row.number !== next.number)
  }

  return result
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 1 ? (sorted[mid] ?? null) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

/** Pass rate and median duration of completed runs; cancelled and skipped runs don't count. */
export function ciHealth(
  runs: { status: string; conclusion: string | null; startedAt: string; updatedAt: string }[],
): CiHealth {
  const counted = runs.filter(
    r => r.status === 'completed' && r.conclusion !== null && r.conclusion !== 'cancelled' && r.conclusion !== 'skipped',
  )
  const passed = counted.filter(r => r.conclusion === 'success').length
  const minutes = counted.map(r => (Date.parse(r.updatedAt) - Date.parse(r.startedAt)) / 60_000).filter(m => m >= 0)

  return {
    runs: counted.length,
    passRate: counted.length > 0 ? Math.round((100 * passed) / counted.length) : null,
    medianMinutes: median(minutes),
  }
}

export function severityCounts(levels: (string | null | undefined)[]): Severity {
  const counts: Severity = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const level of levels) {
    const key = (level ?? '').toLowerCase()
    if (key === 'critical' || key === 'high' || key === 'medium' || key === 'low') counts[key]++
    else if (key === 'moderate' || key === 'warning') counts.medium++
    else if (key === 'error') counts.high++
    else counts.low++
  }

  return counts
}

/** Median hours from opening to merge, over PRs merged since `since`. */
export function cycleHours(merged: { createdAt: string; mergedAt: string }[]): number | null {
  const hours = merged.map(p => (Date.parse(p.mergedAt) - Date.parse(p.createdAt)) / 3_600_000)
  const value = median(hours)

  return value === null ? null : Math.round(value * 10) / 10
}

/**
 * The budget mode sayg-setup would set from the plan windows: tight past
 * 85% of any window, exhausted at 100%, abundant when the weekly window is
 * under half used with two days or less to its reset.
 */
export function budgetMode(windows: Window[], now: number): BudgetMode {
  if (windows.length === 0) return 'unknown'
  if (windows.some(w => w.percentUsed >= 100)) return 'exhausted'
  if (windows.some(w => w.percentUsed >= 85)) return 'tight'
  const week = windows.find(w => w.kind === 'seven_day')
  if (week?.resetsAt && week.percentUsed < 50 && Date.parse(week.resetsAt) - now <= 2 * DAY_MS) return 'abundant'

  return 'normal'
}

const GLYPH: Record<PrState, string> = { ready: '✔', waiting: '◷', blocked: '✖', draft: '✎' }

export function glyph(state: PrState): string {
  return GLYPH[state]
}

export function countStates(rows: PrRow[]): Record<PrState, number> {
  const counts: Record<PrState, number> = { ready: 0, waiting: 0, blocked: 0, draft: 0 }
  for (const row of rows) counts[row.state]++

  return counts
}

export function statusLine(counts: Record<PrState, number>): string {
  return (
    [
      counts.ready && `${counts.ready} ready`,
      counts.waiting && `${counts.waiting} waiting`,
      counts.blocked && `${counts.blocked} blocked`,
      counts.draft && `${counts.draft} draft`,
    ]
      .filter(Boolean)
      .join(' · ') || 'none'
  )
}

export function severityText(counts: Severity | null): string {
  if (counts === null) return 'n/a'
  const parts = (['critical', 'high', 'medium', 'low'] as const).filter(k => counts[k] > 0).map(k => `${counts[k]} ${k}`)

  return parts.length > 0 ? parts.join(' · ') : 'none open'
}

export function windowLabel(kind: string): string {
  return kind === 'five_hour' ? '5h' : kind === 'seven_day' ? '7d' : kind
}

/** One line with the whole picture, for the top of the pane and the status line. */
export function headline(board: Board | null, ai: Ai | null): string {
  const parts: string[] = []
  if (board) {
    parts.push(board.prs.length > 0 ? `PRs ${statusLine(countStates(board.prs))}` : 'no open PRs')
    if (board.sonar) parts.push(`gate ${board.sonar.gate}`)
    const vulns = board.security.dependabot
    if (vulns && vulns.critical + vulns.high > 0) parts.push(`${vulns.critical + vulns.high} critical/high vulns`)
    if (board.ci.passRate !== null) parts.push(`CI ${board.ci.passRate}%`)
  }
  if (ai && ai.windows.length > 0) {
    parts.push(ai.windows.map(w => `${windowLabel(w.kind)} ${Math.round(w.percentUsed)}%`).join(' '))
  }

  return parts.join(' │ ')
}

/** Plain-text board, for the slash command's output that the model also reads. */
export function toText(board: Board, ai: Ai | null, now: number): string {
  const rows = board.prs
  const lines: string[] = [`${board.repo}: ${headline(board, ai)}`]
  if (rows.length > 0) lines.push('', 'Merge order:')
  rows.forEach((row, i) => {
    const after = row.after.length > 0 ? ` [after #${row.after.join(', #')}]` : ''
    const flags = `${row.isStale ? ' [stale]' : ''}${row.needsMyReview ? ' [your review]' : ''}`
    lines.push(`${i + 1}. ${glyph(row.state)} #${row.number} ${row.title} (${row.author})${after}${flags} -> ${row.action}`)
    const later = row.overlaps.filter(o => rows.findIndex(r => r.number === o.number) > i)
    if (later.length > 0) {
      lines.push(`   shares files with ${later.map(o => `#${o.number} (${o.files})`).join(', ')}: rebase those after merging this one`)
    }
  })
  lines.push('', 'Health:')
  if (board.sonar) {
    const m = board.sonar.measures
    lines.push(
      `- Sonar (${board.sonar.at.slice(0, 10)}): gate ${board.sonar.gate}, coverage ${m.coverage ?? 'n/a'}%, duplication ${m.duplicated_lines_density ?? 'n/a'}%, BLOCKER/HIGH open ${board.sonar.severeOpen}, security issues ${board.sonar.securityOpen}, hotspots ${board.sonar.hotspots}`,
    )
  } else {
    lines.push('- Sonar: no sayg-sonar report found')
  }
  lines.push(
    `- CI on default branch: ${board.ci.passRate === null ? 'no runs' : `${board.ci.passRate}% pass over ${board.ci.runs} runs, median ${board.ci.medianMinutes?.toFixed(1)} min`}`,
  )
  lines.push(`- Dependabot: ${severityText(board.security.dependabot)}`)
  lines.push(`- Code scanning: ${severityText(board.security.codeScanning)}`)
  lines.push(`- Secret scanning: ${board.security.secretScanning ?? 'n/a'} open`)
  lines.push(
    '',
    `Flow: ${board.flow.mergedLast7d} merged in 7 days, median ${board.flow.medianCycleHours ?? 'n/a'} h open-to-merge, ${board.flow.stale} stale, ${board.flow.reviewsForMe} waiting for your review`,
  )
  if (ai) {
    const skills = Object.entries(ai.skills).sort((a, b) => b[1] - a[1])
    lines.push(
      `AI: budget mode ${budgetMode(ai.windows, now)}; skills this session: ${skills.length > 0 ? skills.map(([s, n]) => `${s} ×${n}`).join(', ') : 'none'}`,
    )
  }

  return lines.join('\n')
}

// Database migration folders and files of the common tools, and a sayg cell's own db/.
const SCHEMA = /(^|\/)(migrations?|migrate|alembic\/versions|prisma\/migrations|db\/migrate|flyway|liquibase|supabase\/migrations)\/|(^|\/)cells\/[^/]+\/db\/|\.sql$/
// A cell's public surface: changing it means its consumers have to follow.
const CONTRACT = /(^|\/)cells\/[^/]+\/contract\//

export function migrationOf(files: string[]): Migration {
  const schema = files.filter(f => SCHEMA.test(f))
  const contract = files.filter(f => CONTRACT.test(f))
  const kind = schema.length > 0 && contract.length > 0 ? 'both' : schema.length > 0 ? 'schema' : contract.length > 0 ? 'contract' : 'none'

  return { kind, files: [...schema, ...contract] }
}

/** The Claude Code session a PR body links (Claude Code PRs end with one), else the PR's own conversation. */
export function threadUrl(body: string, prUrl: string): string {
  return body.match(/https:\/\/claude\.ai\/code\/session_[A-Za-z0-9]+/)?.[0] ?? prUrl
}

/** When production last deployed successfully, from GitHub deployments to an environment named like prod. */
export function lastProductionDeploy(deploys: DeployRow[]): string | null {
  const times = deploys
    .filter(d => d.kind === 'deployment' && /prod/i.test(d.name) && d.state === 'success')
    .map(d => d.at)
    .sort()

  return times.at(-1) ?? null
}

export function isPendingDeploy(migration: Migration, mergedAt: string, lastProduction: string | null): boolean {
  if (migration.kind === 'none') return false

  return lastProduction === null || Date.parse(mergedAt) > Date.parse(lastProduction)
}

export const SENTENCE_MAX = 180

/** Reads one .sayg/insights/pr-<n>.json written by sayg-pitch (insights mode); undefined when it does not hold the three sentences. */
export function parseInsight(text: string): Insight | undefined {
  let raw: any
  try {
    raw = JSON.parse(text)
  } catch {
    return undefined
  }
  const sentence = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, SENTENCE_MAX) : undefined)
  const insight = sentence(raw?.insight)
  const improvement = sentence(raw?.improvement)
  const critique = sentence(raw?.critique)
  if (typeof raw?.pr !== 'number' || !insight || !improvement || !critique) return undefined

  return {
    pr: raw.pr,
    sha: typeof raw.sha === 'string' ? raw.sha : '',
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : '',
    model: typeof raw.model === 'string' ? raw.model : '',
    insight,
    improvement,
    critique,
    sources: Array.isArray(raw.sources)
      ? raw.sources
          .filter((s: any) => typeof s?.url === 'string' && /^https?:\/\//.test(s.url))
          .map((s: any) => ({ title: String(s.title ?? s.url), url: s.url }))
      : [],
  }
}

/** Plain-text features view, for the slash command's output that the model also reads. */
export function featuresText(board: Board, insights: Record<string, Insight>): string {
  const lines = [`${board.repo}: ${board.prs.length} open, ${board.merged.length} merged in 14 days`]
  const pending = board.merged.filter(m => m.isPendingDeploy)
  const openMigrations = board.prs.filter(p => p.migration.kind !== 'none')
  if (pending.length + openMigrations.length > 0) {
    lines.push('', 'Migrations:')
    for (const m of pending) lines.push(`- #${m.number} merged, not deployed yet: ${m.migration.files.join(', ')}`)
    for (const p of openMigrations) lines.push(`- #${p.number} open, carries ${p.migration.kind}: ${p.migration.files.join(', ')}`)
  }
  const describe = (number: number, title: string, state: string, sha: string) => {
    lines.push(`- #${number} ${title} (${state})`)
    const found = insights[String(number)]
    if (!found) return lines.push('  no insight yet')
    if (found.sha && sha && found.sha !== sha) lines.push('  (insight older than the latest commit)')
    lines.push(`  insight: ${found.insight}`, `  improve: ${found.improvement}`, `  critique: ${found.critique}`)
  }
  if (board.prs.length > 0) lines.push('', 'Open:')
  for (const p of board.prs) describe(p.number, p.title, p.state, p.headSha)
  if (board.merged.length > 0) lines.push('', 'Merged:')
  for (const m of board.merged) describe(m.number, m.title, 'merged', m.sha)

  return lines.join('\n')
}

/** owner/repo from a git remote URL (https or ssh), GitHub only. */
export function parseRemote(url: string): string | undefined {
  const match = url.trim().match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/)

  return match ? `${match[1]}/${match[2]}` : undefined
}
