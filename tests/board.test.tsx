import { expect, test } from 'claude-code/testing'

import type { Ai, Board } from '../types'
import {
  budgetMode,
  ciHealth,
  classify,
  cycleHours,
  headline,
  order,
  parseRemote,
  severityCounts,
  summarizeChecks,
  summarizeReviews,
  toText,
  type PrInput,
} from '../hooks/board'

const NOW = Date.parse('2026-10-20T00:00:00Z')

const base: PrInput = {
  number: 1,
  title: 'One',
  url: 'https://github.com/o/r/pull/1',
  author: 'ana',
  base: 'main',
  head: 'feat-1',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-19T00:00:00Z',
  isDraft: false,
  mergeableState: 'clean',
  failedChecks: [],
  pendingChecks: 0,
  isApproved: true,
  hasChangesRequested: false,
  requestedReviewers: [],
  files: ['a.ts'],
}
const pr = (over: Partial<PrInput>): PrInput => ({ ...base, ...over })

test('each PR gets the action it needs next', async () => {
  expect(classify(pr({})).action).toBe('Merge')
  expect(classify(pr({ isDraft: true })).state).toBe('draft')
  expect(classify(pr({ mergeableState: 'dirty' })).action).toBe('Resolve conflicts with main')
  expect(classify(pr({ failedChecks: ['lint', 'test'] })).action).toBe('Fix CI: lint, test')
  expect(classify(pr({ hasChangesRequested: true })).action).toBe('Address requested changes')
  expect(classify(pr({ pendingChecks: 2 })).state).toBe('waiting')
  expect(classify(pr({ mergeableState: 'behind' })).action).toBe('Update branch with main')
  expect(classify(pr({ mergeableState: 'blocked', isApproved: false })).action).toBe('Get a review')
})

test('stacked PRs merge after their parent, ready ones first, then oldest', async () => {
  const rows = order(
    [
      pr({ number: 3, head: 'child', base: 'feat-1', createdAt: '2026-09-01T00:00:00Z' }),
      pr({ number: 1 }),
      pr({ number: 2, head: 'feat-2', failedChecks: ['test'], createdAt: '2026-08-01T00:00:00Z' }),
      pr({ number: 4, head: 'feat-4', createdAt: '2026-10-05T00:00:00Z' }),
    ],
    'me',
    NOW,
  )

  expect(rows.map(r => r.number)).toEqual([1, 3, 4, 2])
  expect(rows[1]?.after).toEqual([1])
})

test('stale PRs and reviews waiting on me are flagged', async () => {
  const [row] = order([pr({ updatedAt: '2026-10-10T00:00:00Z', requestedReviewers: ['me'] })], 'me', NOW)

  expect(row?.isStale).toBe(true)
  expect(row?.needsMyReview).toBe(true)
})

test('CI health, severities, cycle time and budget mode are computed from raw data', async () => {
  expect(
    ciHealth([
      { status: 'completed', conclusion: 'success', startedAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:04:00Z' },
      { status: 'completed', conclusion: 'failure', startedAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:06:00Z' },
      { status: 'completed', conclusion: 'cancelled', startedAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:01:00Z' },
      { status: 'in_progress', conclusion: null, startedAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:01:00Z' },
    ]),
  ).toEqual({ runs: 2, passRate: 50, medianMinutes: 5 })
  expect(severityCounts(['critical', 'HIGH', 'moderate', 'error', 'note'])).toEqual({
    critical: 1,
    high: 2,
    medium: 1,
    low: 1,
  })
  expect(
    cycleHours([
      { createdAt: '2026-10-01T00:00:00Z', mergedAt: '2026-10-01T10:00:00Z' },
      { createdAt: '2026-10-01T00:00:00Z', mergedAt: '2026-10-02T00:00:00Z' },
    ]),
  ).toBe(17)
  expect(budgetMode([], NOW)).toBe('unknown')
  expect(budgetMode([{ kind: 'five_hour', percentUsed: 90 }], NOW)).toBe('tight')
  expect(budgetMode([{ kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-21T00:00:00Z' }], NOW)).toBe('abundant')
  expect(budgetMode([{ kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-26T00:00:00Z' }], NOW)).toBe('normal')
})

test('checks, reviews and remotes are read the way GitHub reports them', async () => {
  expect(
    summarizeChecks([
      { name: 'lint', status: 'completed', conclusion: 'failure' },
      { name: 'test', status: 'in_progress', conclusion: null },
      { name: 'build', status: 'completed', conclusion: 'success' },
    ]),
  ).toEqual({ failedChecks: ['lint'], pendingChecks: 1 })
  expect(
    summarizeReviews([
      { user: 'bo', state: 'CHANGES_REQUESTED' },
      { user: 'bo', state: 'APPROVED' },
      { user: 'cy', state: 'COMMENTED' },
    ]),
  ).toEqual({ isApproved: true, hasChangesRequested: false })
  expect(parseRemote('git@github.com:brancante/spec-as-you-go.git')).toBe('brancante/spec-as-you-go')
  expect(parseRemote('https://github.com/o/r')).toBe('o/r')
  expect(parseRemote('https://gitlab.com/o/r.git')).toBeUndefined()
})

const BOARD: Board = {
  repo: 'o/r',
  me: 'me',
  refreshedAt: NOW,
  prs: order(
    [
      pr({ number: 7, title: 'Add billing cell', files: ['a.ts', 'b.ts'] }),
      pr({ number: 8, head: 'x', failedChecks: ['test'], files: ['b.ts'], requestedReviewers: ['me'] }),
    ],
    'me',
    NOW,
  ),
  deploys: [{ name: 'production', state: 'success', ref: 'main', at: '2026-10-19T00:00:00Z', url: '' }],
  evolution: { stages: { S1: 1, S3: 2 }, slices: { done: 3, building: 1 }, discoveries: 4 },
  sonar: {
    runId: 9,
    at: '2026-10-18T00:00:00Z',
    url: 'https://github.com/o/r/actions/runs/9',
    gate: 'OK',
    severeOpen: 0,
    securityOpen: 1,
    hotspots: 2,
    measures: { coverage: '71.5', duplicated_lines_density: '3.1', ncloc: '1200' },
  },
  ci: { runs: 20, passRate: 95, medianMinutes: 4.5 },
  security: { dependabot: { critical: 0, high: 2, medium: 1, low: 0 }, codeScanning: null, secretScanning: 0 },
  flow: { mergedLast7d: 5, medianCycleHours: 17, stale: 0, reviewsForMe: 1 },
}

const AI: Ai = {
  skills: { 'spec-as-you-go:sayg-slice': 3, 'spec-as-you-go:sayg-gates': 1 },
  windows: [
    { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-20T03:00:00Z' },
    { kind: 'seven_day', percentUsed: 61.5, resetsAt: '2026-10-23T00:00:00Z' },
  ],
  costUsd: 1.25,
  contextPercent: 37,
}

test('the headline and the command text carry the whole picture', async () => {
  expect(headline(BOARD, AI)).toBe('PRs 1 ready · 1 blocked │ gate OK │ 2 critical/high vulns │ CI 95% │ 5h 42% 7d 62%')
  const text = toText(BOARD, AI, NOW)

  expect(text).toContain('1. ✔ #7 Add billing cell (ana) -> Merge')
  expect(text).toContain('#8 One (ana) [your review] -> Fix CI: test')
  expect(text).toContain('shares files with #8 (1)')
  expect(text).toContain('coverage 71.5%')
  expect(text).toContain('Dependabot: 2 high · 1 medium')
  expect(text).toContain('Code scanning: n/a')
  expect(text).toContain('spec-as-you-go:sayg-slice ×3')
})

const PANE = {
  plugin: 'spec-as-you-go',
  component: 'Pane',
  requestId: 'sayg-board',
  props: {
    title: 'SAYG board',
    isFocused: false,
    bodyColumns: 70,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const SEED = (tabValue?: string) => (_: unknown, e: { key: string }, next: (e: any) => any) => {
  if (e.key === 'board') return { value: { value: { shape: 'board-2', value: BOARD }, version: 1 } }
  if (e.key === 'ai') return { value: { value: { shape: 'ai-1', value: AI }, version: 1 } }
  if (e.key === 'refresh') return { value: { value: { isLoading: false }, version: 1 } }
  if (e.key === 'tab' && tabValue) return { value: { value: tabValue, version: 1 } }

  return next(e)
}

const TAB_CASES = [
  { tab: 'prs', texts: [/Merge order/, /Fix CI: test · your review/] },
  { tab: 'health', texts: [/Gate OK/, /Coverage 71.5%/, /2 high · 1 medium/, /95% pass/] },
  { tab: 'flow', texts: [/Merged in 7 days: 5/, /Cells by stage: S1 1 · S3 2/, /production/] },
  { tab: 'ai', texts: [/budget mode normal/, /42%/, /\$1.25/, /3× spec-as-you-go:sayg-slice/] },
]

for (const c of TAB_CASES) {
  test(`the ${c.tab} tab draws its section on every surface`, async ($, on) => {
    on('clock.now', () => ({ value: NOW + 60 * 60 * 1000 }))
    on('state.get', SEED(c.tab))
    for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
      const ui = await $.ui.mount({ ...PANE, surface })
      expect(await ui.find({ type: 'Text', text: /PRs 1 ready · 1 blocked/ })).toBeDefined()
      for (const text of c.texts) {
        expect(await ui.find({ type: 'Text', text })).toBeDefined()
      }
      await ui.unmount()
    }
  })
}

test('pressing a tab switches the section', async ($, on) => {
  on('clock.now', () => ({ value: NOW + 60 * 60 * 1000 }))
  on('state.get', SEED())
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect(await ui.find({ type: 'Text', text: /Merge order/ })).toBeDefined()
  await ui.press({ key: 'tab-health' })
  expect(await ui.find({ type: 'Text', text: /Code quality/ })).toBeDefined()
  await ui.unmount()
})

test('before the first refresh the pane says it is loading', async ($, on) => {
  on('clock.now', () => ({ value: 0 }))
  on('state.get', (_, e, next) =>
    e.key === 'refresh' ? { value: { value: { isLoading: true }, version: 1 } } : next(e),
  )
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect(await ui.find({ type: 'Text', text: /loading/ })).toBeDefined()
  await ui.unmount()
})
