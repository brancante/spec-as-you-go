export type PrState = 'ready' | 'waiting' | 'blocked' | 'draft'

export type PrRow = {
  number: number
  title: string
  url: string
  author: string
  base: string
  head: string
  createdAt: string
  state: PrState
  action: string
  /** PR numbers that must merge first (stacked on their branch). */
  after: number[]
  /** Other open PRs touching the same files, with the shared file count. */
  overlaps: { number: number; files: number }[]
  /** No update for 5 days or more. */
  isStale: boolean
  /** The signed-in GitHub user is a requested reviewer. */
  needsMyReview: boolean
  /** Where a click goes: the Claude Code session that made the PR when its body links one, else the PR conversation. */
  threadUrl: string
  headSha: string
  migration: Migration
}

/** Schema migrations (database) and contract changes (a cell's public surface) a PR carries. */
export type Migration = { kind: 'none' | 'schema' | 'contract' | 'both'; files: string[] }

export type MergedRow = {
  number: number
  title: string
  url: string
  threadUrl: string
  mergedAt: string
  sha: string
  migration: Migration
  /** Carries a migration and merged after the last successful production deploy (or no deploy data). */
  isPendingDeploy: boolean
}

/** One short sentence each, researched on the web by sayg-insights; read from .sayg/insights/pr-<n>.json. */
export type Insight = {
  pr: number
  sha: string
  generatedAt: string
  model: string
  insight: string
  improvement: string
  critique: string
  sources: { title: string; url: string }[]
}

export type Generating = { prs: number[]; startedAt: number }

export type DeployRow = {
  kind: 'deployment' | 'run'
  name: string
  state: string
  ref: string
  at: string
  url: string
}

export type Evolution = {
  stages: Record<string, number>
  slices: Record<string, number>
  discoveries: number
}

export type Severity = { critical: number; high: number; medium: number; low: number }

export type Sonar = {
  runId: number
  at: string
  url: string
  gate: string
  severeOpen: number
  securityOpen: number
  hotspots: number
  measures: Record<string, string>
}

export type CiHealth = { runs: number; passRate: number | null; medianMinutes: number | null }

/** `null` where GitHub did not answer: the feature is off or the login lacks access. */
export type Security = {
  dependabot: Severity | null
  codeScanning: Severity | null
  secretScanning: number | null
}

export type Flow = {
  mergedLast7d: number
  medianCycleHours: number | null
  stale: number
  reviewsForMe: number
}

export type Board = {
  repo: string
  me: string
  refreshedAt: number
  prs: PrRow[]
  merged: MergedRow[]
  lastProductionDeployAt: string | null
  deploys: DeployRow[]
  evolution: Evolution
  sonar: Sonar | null
  ci: CiHealth
  security: Security
  flow: Flow
}

export type Window = { kind: string; percentUsed: number; resetsAt?: string }

export type BudgetMode = 'abundant' | 'normal' | 'tight' | 'exhausted' | 'unknown'

/** The session's own AI picture: skills used, plan windows, cost, context. */
export type Ai = {
  skills: Record<string, number>
  windows: Window[]
  costUsd: number | null
  contextPercent: number | null
}

export type Tab = 'prs' | 'health' | 'flow' | 'ai'

export type Refresh = { isLoading: boolean; error?: string }

declare module 'claude-code' {
  interface PluginState {
    'spec-as-you-go': {
      board: Shaped<Board | null>
      refresh: Refresh
      ai: Shaped<Ai>
      tab: Tab
      insights: Shaped<Record<string, Insight>>
      generating: Generating
    }
  }
}
