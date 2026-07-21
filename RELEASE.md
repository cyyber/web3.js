# @theqrl/web3.js Release Guidelines

This repository uses pnpm, Turbo, and `multi-semantic-release`. Releases are intended to be produced by GitHub Actions from `main` after the audit-readiness gates are complete and the repository is pushed under the `theQRL/web3.js` upstream project.

Until the first audited release, `main` is treated as unreleased. Do not publish packages manually from a workstation.

## Release Strategy

Packages are versioned independently by `multi-semantic-release` using Conventional Commits. When a release is enabled, CI analyzes commits merged to `main`, decides which workspace packages need new versions, updates package changelogs, creates Git tags and GitHub releases, and publishes public packages to the `@theqrl` npm organization.

Release publishing is guarded by:

- The workflow must run in `theQRL/web3.js`.
- The repository variable `RELEASES_ENABLED` must be set to `true`.
- The protected GitHub environment `npm-publish` must approve the job.
- The CI workflow must pass first.
- Release tarballs must pass CommonJS and ESM smoke tests on Node 20.19.0 (the advertised `engines.node` floor) before publish.
- npm publishing must run from Node 22.14 or newer with npm 11.5.1 or newer so npm trusted publishing can use OIDC.
- npm publishing must use provenance (`NPM_CONFIG_PROVENANCE=true`).

## Commit Message Format

Use Conventional Commits:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Release-triggering commits:

| Commit type | Version bump |
| --- | --- |
| `fix:` | Patch |
| `perf:` | Patch |
| `feat:` | Minor |
| `feat!:` or `BREAKING CHANGE:` | Major |

Non-release changes should use prefixes such as `docs:`, `test:`, `ci:`, `chore:`, `refactor:`, or `style:`.

## Keeping Package Versions In Sync

`multi-semantic-release` releases packages based on committed changes in each package path. If maintainers need to deliberately keep all publishable package versions aligned, run this locally before opening the release-prep PR:

```sh
pnpm run release:touch-packages
```

This writes a package-local `.release-touch` marker into every publishable package. Commit those marker changes with a release-triggering Conventional Commit such as `fix(release): refresh package release markers`. The marker files are intentionally outside the package `files` allowlists and are excluded from npm tarballs.

Do not run `release:touch-packages` inside the release workflow. Uncommitted files created by CI are not part of the commit history analyzed by semantic-release and should not be used to force package releases.

## Pre-Release Requirements

Before setting `RELEASES_ENABLED=true`, the release owner must confirm:

- No tests/CI blockers.
- Required branch protection is configured for `main`
- `CODEOWNERS` review is enforced.
- The `npm-publish` environment is protected and limited to release maintainers.
- npm organization access and trusted-publishing configuration for all `@theqrl/*` packages is ready.
- Trusted publishing is scoped to `.github/workflows/release.yml`.
- `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm run doctor`,
  `pnpm run audit:supply-chain`, and required build/test gates pass in CI.
- `pnpm run release:dry-run` has been reviewed from a release-prep branch.

## CI Release Flow

The release workflow:

1. Runs the reusable CI workflow.
2. Uses Node 22.14 in the release-preparation job.
3. Installs dependencies from `pnpm-lock.yaml`.
4. Builds publishable packages.
5. Snapshots current package versions.
6. Runs `multi-semantic-release` to update package versions, changelogs, Git tags, and GitHub releases.
7. Rebuilds packages after version updates.
8. Packs released packages.
9. Generates SHA-256 and SHA-512 checksums.
10. Uploads tarballs and release metadata as a short-lived workflow artefact.
11. Downloads the tarballs in a Node 20.19.0 job (the advertised floor) and smoke-tests CommonJS `require()` and ESM `import`.
12. Publishes the already-tested tarballs from a Node 22.14/npm 11 job using npm trusted publishing.
13. Generates SPDX and CycloneDX SBOMs.
14. Creates GitHub attestations for release artefacts and SBOMs.
15. Uploads tarballs, checksums, and SBOMs to each package release.
16. Generates SLSA provenance for released tarballs.
17. Uploads `provenance.intoto.jsonl` to each package release.

## Local Commands

Use these commands only for release preparation and verification:

```sh
corepack enable
pnpm install --frozen-lockfile --ignore-scripts
pnpm run doctor
pnpm run audit:supply-chain
pnpm run build
pnpm run build:web
pnpm run release:inspect-packages
pnpm run release:pack-packages
pnpm run release:packages
pnpm run release:smoke-tarballs dist/released-packages.tsv dist/tarballs
pnpm run release:dry-run
```

`pnpm run release` is for CI. Do not run it locally against the upstream repository.

## Package Artefacts

Release tarballs must be built from CI output. Generated `lib/` and `dist/` directories are not expected to be committed unless that policy is explicitly changed before audit freeze.

Each package release should have:

- npm provenance.
- GitHub release notes generated from Conventional Commits.
- The npm tarball attached to the GitHub release.
- SHA-256 and SHA-512 checksum files.
- SPDX and CycloneDX SBOMs.
- GitHub build-provenance and SBOM attestations.
- SLSA provenance as `provenance.intoto.jsonl`.

Post-release verification steps are documented in
[`docs/release-verification.md`](docs/release-verification.md).
