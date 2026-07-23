# Artifact Hygiene

This repository keeps generated package output and local accidental files out of
tracked source. CI builds the packages before packing or publishing, so generated
`lib/`, `dist/`, coverage, and temporary dependency-manager artefacts should not
be committed.

## Removed From Tracked Scope

The current cleanup removes these committed artefacts from the tracked working
tree:

- Root and docs `yarn.lock` files.
- Black-box test `.yarnrc` and `yarn.lock` files.
- The accidental copied fixture `packages/web3/test/fixtures/transactions copy.json`.

Local build outputs may still exist after validation commands, but they are
ignored and must remain untracked.

## Enforcement

`pnpm run hygiene` rejects:

- Tracked Yarn artefacts, generated package output, coverage output, local
  secret files, and copied-file artefacts.
- Local `.secrets.json`, `.yarnrc`, `yarn.lock`, and `* copy.*` files anywhere
  outside ignored dependency directories.
- Broken, absolute, outside-repository, or removed ESLint legacy-template
  symlinks.

Before audit handoff or release packing, run `pnpm run clean` to remove ignored
build/test output, then rerun `pnpm run hygiene`.
