# QRNS contract fixtures

The Hyperion sources in `fixtures/contracts/{QRNSRegistry,PublicResolver,NameWrapper}.hyp`
preserve the existing fixture ABIs and deployment arguments. They are adapted from
[ens-contracts d9e260d](https://github.com/ensdomains/ens-contracts/tree/d9e260dcb87843c6b0161be019aeb55e2da6ef5d).
The resolver retains its ownership checks, dummy wrapper, and resolver interfaces.
The dummy wrapper returns `tx.origin`; it is only a test fixture.

The VM64 changes use 64-byte address payloads and ABI return words. The DNS helper
subset used by the resolver uses byte operations instead of Ethereum-width memory
assembly; DNS wire fields and name hashes retain their original widths.

Regenerate the bytecode with native Hyperion commit
`2b9a0f1d5352cf7a4d64718fb04b4b6640041ba1` (optimizer enabled, 200 runs):

```sh
HYPC_PATH=/path/to/hypc node packages/web3-qrl-qrns/test/fixtures/qrns/compile.cjs
```

The ABI files remain unchanged. This compiler is separate from the older
`@theqrl/hypc` JavaScript binding used by the general fixture script.
