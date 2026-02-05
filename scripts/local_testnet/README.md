# Local Testnet (Kurtosis)

## Start / Stop

- Start: `yarn pos:start`
- Stop: `yarn pos:stop`

## Clef: import accounts + auto-authorization

The Kurtosis package starts a `clef` remote-signer service (`signer-clef`). By default it uses the interactive CLI UI, which blocks on transaction approvals and password prompts.

To:
- import the seeds in `scripts/accounts.json` into the clef keystore, and
- enable non-interactive signing (auto-approve + auto-password)

run:

- `yarn pos:clef:setup`

This will:
- upload a small `clef-autoui` shim into the enclave and restart `signer-clef` to run behind it
- import each `seed` from `scripts/accounts.json` into `/clef-keystore/keystore`

### Notes

- Default clef key password is `passwordpassword` (override with `CLEF_KEY_PASSWORD=...`).
- This is meant for **local testing only**; it auto-approves signing requests.
- If you tear down the enclave (`yarn pos:stop`) you’ll need to run `yarn pos:clef:setup` again after restarting.

