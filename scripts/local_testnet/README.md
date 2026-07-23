# Local Testnet (Kurtosis)

## Start / Stop

- Start: `pnpm run pos:start`
- Stop: `pnpm run pos:stop`
- `pnpm run pos:start` also runs `pnpm run pos:clef:setup` after the network is up.
- The start script defaults to cyyber/qrl-package PR #13 at commit
  `261beca5fada67ec5ccad668025e3e07efb3f1e4`. Override `QRL_PKG_REPOSITORY` or
  `QRL_PKG_VERSION` to test another package checkout.

## Clef: import accounts + auto-authorization

The Kurtosis package starts a `clef` remote-signer service (`signer-clef`). By default it uses the interactive CLI UI, which blocks on transaction approvals and password prompts.

To:
- import the seeds in `scripts/accounts.json` into the clef keystore, and
- enable non-interactive signing (auto-approve + auto-password)

run manually:

- `pnpm run pos:clef:setup`

This will:
- upload a small `clef-autoui` shim into the enclave and restart `signer-clef` to run behind it
- import each `seed` from `scripts/accounts.json` into `/clef-keystore/keystore`

### Notes

- Default clef key password is `passwordpassword` (override with `CLEF_KEY_PASSWORD=...`).
- This is meant for **local testing only**; it auto-approves signing requests.
- If you tear down the enclave (`pnpm run pos:stop`), `pnpm run pos:start` will run clef setup again on the next start.
