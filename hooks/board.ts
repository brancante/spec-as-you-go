// Pure logic of the sayg board: what each PR needs next and the order to
// merge them in. No `$` here, so it is tested on its own.
import type { PrRow, PrState } from '../types'

export type PrInput = {
  number: number
  title: string
  url: string
  author: string
  base: string
  head: string
  createdAt: string
  isDraft: boolean
  /** GitHub's mergeable_state: clean, dirty, behind, blocked, unstable, has_hooks, draft, unknown. */
  mergeableState: string
  failedChecks: string[]
  pendingChecks: number
  isApproved: boolean
  hasChangesRequested: boolean
  files: string[]
}

const RANK: Record<PrState, number> = { ready: 0, waiting: 1, blocked: 2, draft: 3 }

const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure'])

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
export function order(prs: PrInput[]): PrRow[] {
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

const GLYPH: Record<PrState, string> = { ready: '✔', waiting: '◷', blocked: '✖', draft: '✎' }

export function glyph(state: PrState): string {
  return GLYPH[state]
}

/** Plain-text board, for the slash command's output that the model also reads. */
export function toText(repo: string, rows: PrRow[]): string {
  if (rows.length === 0) return `${repo}: no open pull requests.`
  const counts = countStates(rows)
  const lines = [`${repo}: ${rows.length} open PRs (${statusLine(counts)}). Merge order:`]
  rows.forEach((row, i) => {
    const after = row.after.length > 0 ? ` [after #${row.after.join(', #')}]` : ''
    lines.push(`${i + 1}. ${glyph(row.state)} #${row.number} ${row.title} (${row.author})${after} -> ${row.action}`)
    const later = row.overlaps.filter(o => rows.findIndex(r => r.number === o.number) > i)
    if (later.length > 0) {
      lines.push(`   shares files with ${later.map(o => `#${o.number} (${o.files})`).join(', ')}: rebase those after merging this one`)
    }
  })

  return lines.join('\n')
}

export function countStates(rows: PrRow[]): Record<PrState, number> {
  const counts: Record<PrState, number> = { ready: 0, waiting: 0, blocked: 0, draft: 0 }
  for (const row of rows) counts[row.state]++

  return counts
}

export function statusLine(counts: Record<PrState, number>): string {
  return [
    counts.ready && `${counts.ready} ready`,
    counts.waiting && `${counts.waiting} waiting`,
    counts.blocked && `${counts.blocked} blocked`,
    counts.draft && `${counts.draft} draft`,
  ]
    .filter(Boolean)
    .join(' · ') || 'none'
}

/** owner/repo from a git remote URL (https or ssh), GitHub only. */
export function parseRemote(url: string): string | undefined {
  const match = url.trim().match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/)

  return match ? `${match[1]}/${match[2]}` : undefined
}
