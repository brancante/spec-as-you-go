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
}

export type DeployRow = {
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
  mergedLast7d: number
}

export type Board = {
  repo: string
  refreshedAt: number
  prs: PrRow[]
  deploys: DeployRow[]
  evolution: Evolution
}

export type Refresh = { isLoading: boolean; error?: string }

declare module 'claude-code' {
  interface PluginState {
    'spec-as-you-go': {
      board: Shaped<Board | null>
      refresh: Refresh
    }
  }
}
