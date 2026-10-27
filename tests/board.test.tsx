import { expect, test } from 'claude-code/testing'

import type { Board } from '../types'
import { classify, order, parseRemote, summarizeChecks, summarizeReviews, toText, type PrInput } from '../hooks/board'

const base: PrInput = {
  number: 1,
  title: 'One',
  url: 'https://github.com/o/r/pull/1',
  author: 'ana',
  base: 'main',
  head: 'feat-1',
  createdAt: '2026-10-01T00:00:00Z',
  isDraft: false,
  mergeableState: 'clean',
  failedChecks: [],
  pendingChecks: 0,
  isApproved: true,
  hasChangesRequested: false,
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
  const rows = order([
    pr({ number: 3, head: 'child', base: 'feat-1', createdAt: '2026-09-01T00:00:00Z' }),
    pr({ number: 1 }),
    pr({ number: 2, head: 'feat-2', failedChecks: ['test'], createdAt: '2026-08-01T00:00:00Z' }),
    pr({ number: 4, head: 'feat-4', createdAt: '2026-10-05T00:00:00Z' }),
  ])

  expect(rows.map(r => r.number)).toEqual([1, 3, 4, 2])
  expect(rows[1]?.after).toEqual([1])
})

test('overlapping files are reported against later PRs only', async () => {
  const rows = order([pr({ number: 1, files: ['a.ts', 'b.ts'] }), pr({ number: 2, head: 'x', files: ['b.ts'] })])
  const text = toText('o/r', rows)

  expect(text).toContain('1. ✔ #1 One (ana) -> Merge')
  expect(text).toContain('shares files with #2 (1)')
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
  refreshedAt: 0,
  prs: order([pr({ number: 7, title: 'Add billing cell' }), pr({ number: 8, head: 'x', failedChecks: ['test'] })]),
  deploys: [{ name: 'production', state: 'success', ref: 'main', at: '1970-01-01T00:00:00Z', url: '' }],
  evolution: { stages: { S1: 1, S3: 2 }, slices: { done: 3, building: 1 }, discoveries: 4, mergedLast7d: 5 },
}

const PANE = {
  plugin: 'spec-as-you-go',
  component: 'Pane',
  requestId: 'sayg-board',
  props: {
    title: 'SAYG board',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('the pane draws the merge order, deploys and evolution on every surface', async ($, on) => {
  on('clock.now', () => ({ value: 60 * 60 * 1000 }))
  on('state.get', (_, e, next) =>
    e.key === 'board'
      ? { value: { value: { shape: 'board-1', value: BOARD }, version: 1 } }
      : e.key === 'refresh'
        ? { value: { value: { isLoading: false }, version: 1 } }
        : next(e),
  )

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: /Merge order · 1 ready · 1 blocked/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Fix CI: test/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Cells by stage: S1 1 · S3 2/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /PRs merged in 7 days: 5/ })).toBeDefined()
    await ui.unmount()
  }
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
