// Cell boundary rules (architecture fitness functions) for a TypeScript monorepo.
// Run: npx depcruise apps cells packages --config .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    {
      name: 'cell-isolation',
      comment: 'A cell may use another cell only through its contract/',
      severity: 'error',
      from: { path: '^cells/([^/]+)/' },
      to: { path: '^cells/', pathNot: ['^cells/$1/', '^cells/[^/]+/contract/'] },
    },
    {
      name: 'nothing-imports-labs',
      comment: 'Experiments are promoted, never depended on',
      severity: 'error',
      from: { pathNot: '^labs/' },
      to: { path: '^labs/' },
    },
    {
      name: 'kernel-stays-generic',
      comment: 'packages/ must not depend on business code',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^(apps|cells|labs)/' },
    },
    {
      name: 'domain-is-pure',
      comment: 'domain/ holds business rules only: no server, ui or db imports',
      severity: 'error',
      from: { path: '^cells/[^/]+/domain/' },
      to: { path: '^cells/[^/]+/(server|ui|db)/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
