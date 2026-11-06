import { expect, test } from 'claude-code/testing'

import type { Board, Insight } from '../types'
import {
  featuresText,
  isPendingDeploy,
  lastProductionDeploy,
  migrationOf,
  order,
  parseInsight,
  threadUrl,
  type PrInput,
} from '../hooks/board'
import { insightPrompt, missingInsights } from '../hooks/features'

const NOW = Date.parse('2026-11-06T00:00:00Z')

const base: PrInput = {
  number: 21,
  title: 'Invoices cell',
  url: 'https://github.com/o/r/pull/21',
  author: 'ana',
  base: 'main',
  head: 'invoices',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-05T00:00:00Z',
  isDraft: false,
  mergeableState: 'clean',
  failedChecks: [],
  pendingChecks: 0,
  isApproved: true,
  hasChangesRequested: false,
  requestedReviewers: [],
  files: ['cells/invoices/db/0001_create.sql', 'cells/invoices/ui/List.tsx'],
  body: 'Adds invoices.\n\nhttps://claude.ai/code/session_01ABCdef',
  headSha: 'sha-21',
}

test('migrations are found in schema folders, SQL files and cell contracts', async () => {
  expect(migrationOf(['src/app.ts'])).toEqual({ kind: 'none', files: [] })
  expect(migrationOf(['prisma/migrations/2026_add/migration.sql']).kind).toBe('schema')
  expect(migrationOf(['db/migrate/20261101_add.rb']).kind).toBe('schema')
  expect(migrationOf(['cells/billing/contract/index.ts']).kind).toBe('contract')
  expect(migrationOf(['cells/billing/db/001.sql', 'cells/billing/contract/types.ts']).kind).toBe('both')
})

test('a click goes to the Claude session that made the PR, else the PR conversation', async () => {
  expect(threadUrl(base.body, base.url)).toBe('https://claude.ai/code/session_01ABCdef')
  expect(threadUrl('no link here', base.url)).toBe(base.url)
})

test('a migration merged after the last production deploy is pending', async () => {
  const deploys = [
    { kind: 'deployment' as const, name: 'production', state: 'success', ref: 'main', at: '2026-11-03T00:00:00Z', url: '' },
    { kind: 'deployment' as const, name: 'production', state: 'failure', ref: 'main', at: '2026-11-05T00:00:00Z', url: '' },
    { kind: 'run' as const, name: 'main: deploy-prod', state: 'success', ref: 'abc', at: '2026-11-06T00:00:00Z', url: '' },
  ]
  const last = lastProductionDeploy(deploys)
  const schema = migrationOf(['migrations/002.sql'])

  expect(last).toBe('2026-11-03T00:00:00Z')
  expect(isPendingDeploy(schema, '2026-11-04T00:00:00Z', last)).toBe(true)
  expect(isPendingDeploy(schema, '2026-11-02T00:00:00Z', last)).toBe(false)
  expect(isPendingDeploy(schema, '2026-11-02T00:00:00Z', null)).toBe(true)
  expect(isPendingDeploy(migrationOf(['a.ts']), '2026-11-04T00:00:00Z', null)).toBe(false)
})

test('an insight file is accepted only with its three sentences', async () => {
  const good = parseInsight(
    JSON.stringify({
      pr: 21,
      sha: 'sha-21',
      insight: 'a'.repeat(400),
      improvement: 'Add idempotent retries.',
      critique: 'Duplicates what Stripe Invoicing already does.',
      sources: [{ title: 'Stripe', url: 'https://stripe.com/invoicing' }, { title: 'bad', url: 'javascript:alert(1)' }],
    }),
  )

  expect(good?.insight.length).toBe(180)
  expect(good?.sources).toEqual([{ title: 'Stripe', url: 'https://stripe.com/invoicing' }])
  expect(parseInsight('{"pr": 21, "insight": "x"}')).toBeUndefined()
  expect(parseInsight('not json')).toBeUndefined()
})

const INSIGHT: Insight = {
  pr: 21,
  sha: 'sha-21',
  generatedAt: '2026-11-05T00:00:00Z',
  model: 'opus',
  insight: 'Invoicing per cell keeps billing extractable later.',
  improvement: 'Generate the invoice PDF at the edge, not in the API.',
  critique: 'Stripe Invoicing already covers this for most SMBs.',
  sources: [],
}

const BOARD: Board = {
  repo: 'o/r',
  me: 'me',
  refreshedAt: NOW,
  prs: order([base, { ...base, number: 22, head: 'x', title: 'Dark mode', files: ['apps/web/theme.ts'], body: '', headSha: 'sha-22' }], 'me', NOW),
  merged: [
    {
      number: 19,
      title: 'Ledger contract v2',
      url: 'https://github.com/o/r/pull/19',
      threadUrl: 'https://github.com/o/r/pull/19',
      mergedAt: '2026-11-04T00:00:00Z',
      sha: 'sha-19',
      migration: migrationOf(['cells/ledger/contract/index.ts']),
      isPendingDeploy: true,
    },
  ],
  lastProductionDeployAt: null,
  deploys: [],
  evolution: { stages: {}, slices: {}, discoveries: 0 },
  sonar: null,
  ci: { runs: 0, passRate: null, medianMinutes: null },
  security: { dependabot: null, codeScanning: null, secretScanning: null },
  flow: { mergedLast7d: 1, medianCycleHours: null, stale: 0, reviewsForMe: 0 },
}

test('missing or outdated insights are queued, current ones are not', async () => {
  expect(missingInsights(BOARD, { '21': INSIGHT })).toEqual([22, 19])
  expect(missingInsights(BOARD, { '21': { ...INSIGHT, sha: 'old' } })).toEqual([21, 22, 19])
  expect(insightPrompt('o/r', [22, 19], 'pt-BR')).toContain('PRs #22, #19')
})

test('the command text lists migrations and each PR with its three sentences', async () => {
  const text = featuresText(BOARD, { '21': INSIGHT })

  expect(text).toContain('#19 merged, not deployed yet: cells/ledger/contract/index.ts')
  expect(text).toContain('#21 open, carries schema: cells/invoices/db/0001_create.sql')
  expect(text).toContain('critique: Stripe Invoicing already covers this for most SMBs.')
  expect(text).toContain('#22 Dark mode (ready)\n  no insight yet')
})

const PANE = {
  plugin: 'spec-as-you-go',
  component: 'Pane',
  requestId: 'sayg-features',
  props: {
    title: 'SAYG features',
    isFocused: false,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 50 },
    view: {},
  },
} as const

const SEED = (_: unknown, e: { key: string }, next: (e: any) => any) => {
  if (e.key === 'board') return { value: { value: { shape: 'board-3', value: BOARD }, version: 1 } }
  if (e.key === 'insights') return { value: { value: { shape: 'insights-1', value: { '21': INSIGHT } }, version: 1 } }
  if (e.key === 'refresh') return { value: { value: { isLoading: false }, version: 1 } }

  return next(e)
}

test('the features pane draws migrations, cards and sentences on every surface', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  on('state.get', SEED)
  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /2 open · 1 merged in 14 days · 2 with migrations/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /#19 merged, not deployed yet \(no deploy data/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /💡 Invoicing per cell/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /⚠️ Stripe Invoicing/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /no insight yet/ })).toBeDefined()
    await ui.unmount()
  }
})

test('generating insights starts one background agent for the PRs without one', async ($, on) => {
  const spawned: { prompt: string; model?: string }[] = []
  on('clock.now', () => ({ value: NOW }))
  on('state.get', SEED)
  on('session.cwd', () => ({ value: '/repo' }))
  on('fs.exists', () => ({ value: false }))
  on('agent.spawn', (_, e) => {
    spawned.push({ prompt: e.prompt, model: e.model })

    return { model: 'opus', agentId: 'agent-1' }
  })
  on('ui.toast', () => ({ value: undefined }))
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'generate' })

  expect(spawned.length).toBe(1)
  expect(spawned[0]?.model).toBe('opus')
  expect(spawned[0]?.prompt).toContain('PRs #22, #19')
  await ui.unmount()
})
