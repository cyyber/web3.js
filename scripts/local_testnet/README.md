# Local Testnet (Kurtosis)

## Start / Stop

- Start: `pnpm run pos:start`
- Stop: `pnpm run pos:stop`

The network comes from [`cyyber/qrl-package`](https://github.com/cyyber/qrl-package), pinned to a
revision in `start_local_testnet.sh`. Bump that pin deliberately.

## Endpoints

`network_params.yaml` publishes the execution layer on fixed host ports, so the HTTP RPC is always
`http://127.0.0.1:8545` and the WS RPC `ws://127.0.0.1:8546` — the endpoints `scripts/env.sh` hands
to the test suites. Only one enclave can hold those ports, so stop a running testnet before
starting another.

## Accounts

`network_params.yaml` sets `remote_signer_auto_approve: true`, so the package provisions the
`signer-clef` service with ten development accounts, already imported into the clef keystore,
prefunded at genesis, and approved by an attested clef ruleset. Nothing has to be imported or
patched after the network is up.

Those same ten accounts are listed in `scripts/accounts.json`, which the system tests read through
`scripts/system_tests_utils.ts`. Tests can therefore either sign locally with the seed or send
`from` the account and let the node sign through clef.

When bumping `QRL_PKG_VERSION`, regenerate `scripts/accounts.json` if the package's development
accounts changed — the tests and clef must agree on the same set.

### Notes

- Development networks only: anyone who can reach the node can spend from these accounts.
- The seeds are publicly known dev keys — never fund them on a real network.
