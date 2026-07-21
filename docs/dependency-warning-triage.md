# Dependency Warning Triage

This document records install warning triage for the pnpm 10 migration and
supply-chain hardening pass. Treat new install warnings as review items, but do
not block a release solely because a known warning below is still present.

## Resolved During Triage

- Removed the direct `npm-auth-to-token` development dependency. The temporary
  Verdaccio auth migration stopped overwriting the tracked `.npmrc`; the
  Verdaccio publishing helper was then removed entirely with the Lerna publish
  path.
- Removing `npm-auth-to-token` also removes its deprecated transitive registry
  client chain, including `npm-registry-client`, `request`, `har-validator`,
  `npmlog@4`, `gauge@2`, and `are-we-there-yet@1`.
- Ignored dependency build-script warnings are handled by `strictDepBuilds` and
  the reviewed `allowBuilds` list in `pnpm-workspace.yaml`.
- Removed the local Verdaccio publishing helper and the legacy Lerna canary
  publish script. CI release publishing now uses the semantic-release workflow
  and npm trusted publishing path documented in `RELEASE.md`.
- Migrated linting to ESLint 10 flat config and removed the deprecated
  `eslint-plugin-deprecation` rule because its latest release does not declare
  compatibility with ESLint 10.
- ESLint tracks the newest release that is outside the seven-day
  `minimumReleaseAge` quarantine rather than the newest release on the registry.
  The pinned version lives in the workspace manifests (root `package.json` and
  each package's `devDependencies`), which are the source of truth; it is not
  restated here because it moves every time the quarantine window clears.

## Accepted For The Current Lockfile

- Some release-tool transitive warnings are inherited from
  `multi-semantic-release`, `semantic-release`, conventional-changelog tooling,
  and the current docs/build stack. They remain acceptable while the
  high/critical audit gate (`pnpm run audit:supply-chain`) is green.
- `@typescript-eslint` and `globals` follow the same rule as ESLint above: they
  track the newest release outside the quarantine window, and the manifests —
  not this document — record which version that currently is.
- ESLint 10 reports additional type-safety and stale-disable warnings. These
  are tracked as cleanup debt, not release blockers for this tooling migration,
  because `pnpm run lint` passes with zero errors across all package/tool
  workspaces.

## Follow-Up Work

- Re-run `pnpm install --frozen-lockfile --ignore-scripts` after dependency
  changes and review any warning that is not covered above.
