
# @theqrl/web3.js - Http Provider

![ES Version](https://img.shields.io/badge/ES-2020-yellow)
![Node Version](https://img.shields.io/badge/node-%3E%3D20-green)
[![NPM Package](https://img.shields.io/npm/v/@theqrl/web3-providers-http)](https://www.npmjs.com/package/@theqrl/web3-providers-http)
[![Downloads](https://img.shields.io/npm/dm/@theqrl/web3-providers-http)](https://www.npmjs.com/package/@theqrl/web3-providers-http)

This is a sub-package of [@theqrl/web3.js](https://github.com/theqrl/web3.js).

`@theqrl/web3-providers-http` contains the Web3.js provider for the HTTP protocol.

## Installation

You can install the package either using [NPM](https://www.npmjs.com/package/@theqrl/web3-providers-http) or using [pnpm](https://pnpm.io/)

### Using NPM

```bash
npm install @theqrl/web3-providers-http
```

### Using pnpm

```bash
pnpm add @theqrl/web3-providers-http
```

## Getting Started

-   :writing_hand: If you have questions [submit an issue](https://github.com/theqrl/web3.js/issues/new/choose) or join us on [Discord](https://theqrl.org/discord)
    ![Discord](https://img.shields.io/discord/357604137204056065.svg?label=Discord&logo=discord)

## Request bounds

Every request is bounded by default. No configuration is required, and the bounds cannot be
disabled — only re-tuned to a different finite value.

| Option              | Default        | Bounds                                          |
| ------------------- | -------------- | ----------------------------------------------- |
| `connectionTimeout` | `30_000` (30s) | Time to response headers only                   |
| `requestTimeout`    | `120_000` (2m) | The whole request, body read included           |
| `maxResponseBytes`  | `10485760` (10 MiB) | Decoded response bytes accepted from the node |

```ts
const provider = new HttpProvider('https://node.example', {
	requestTimeout: 300_000, // a longer, still finite deadline
	maxResponseBytes: 32 * 1024 * 1024,
});

// Per-request override, composed with a caller signal.
await provider.request(payload, { requestTimeout: 5_000, signal: controller.signal });
```

**Precedence.** `requestOptions.requestTimeout` > the constructor's `requestTimeout` > the
120s default. The two timeouts are separate phases: `connectionTimeout` is retired once
headers arrive, so it never truncates a slow body read.

**Composed abort.** A caller `signal` is composed with the deadline, never substituted for
it — whichever fires first wins, and neither can be used to disable the other. A caller
abort propagates with the caller's own reason; only a deadline yields a timeout error.

**No infinite opt-out.** `Infinity`, `NaN` and values `<= 0` are rejected at the point they
are supplied. An expensive archival, log or batch call should name a longer *finite*
deadline rather than opting out. There is intentionally no per-method timeout table: the
finite transport default applies uniformly.

**Response cap.** Response bytes are counted as they stream in and the read is aborted as
soon as the total exceeds `maxResponseBytes`, so an oversized body is never fully buffered.
`content-length` is only an early-rejection optimization — it may be absent on a chunked
response, or simply false — so the streamed count is authoritative.

### Errors

| Error                     | Meaning                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `ConnectionTimeoutError`  | Response headers did not arrive within `connectionTimeout`     |
| `RequestTimeoutError`     | The request exceeded `requestTimeout`                          |
| `ResponseTooLargeError`   | The response exceeded `maxResponseBytes`                       |
| `ProviderCapabilityError` | A non-empty response exposed no readable body, so the size bound could not be enforced; the provider fails closed rather than reading it unbounded |
| `ProviderError`           | An invalid (non-finite) timeout option                         |

> [!IMPORTANT]
> A timeout means the outcome is **unknown** — not that the request was rejected. The node
> may have received, accepted and executed the call; only the answer failed to arrive in
> time. For state-changing calls such as transaction submission, never treat a timeout as
> "it did not happen": resubmitting without checking first risks a duplicate. Query by
> hash/nonce to establish the actual outcome. A caller abort carries the same caveat — it
> stops you waiting, it does not undo anything already in flight.
>
> `ResponseTooLargeError` extends `BaseWeb3Error`, not `ResponseError`: a refused response
> has no JSON-RPC error payload to carry.

## Prerequisites

-   :gear: [NodeJS](https://nodejs.org/) (20 or newer)
-   :toolbox: [pnpm](https://pnpm.io/) and [Turbo](https://turbo.build/)

## Package.json Scripts

| Script           | Description                                        |
| ---------------- | -------------------------------------------------- |
| clean            | Uses `rimraf` to remove `dist/`                    |
| build            | Uses `tsc` to build package and dependent packages |
| lint             | Uses `eslint` to lint package                      |
| lint:fix         | Uses `eslint` to check and fix any warnings        |
| format           | Uses `prettier` to format the code                 |
| test             | Uses `jest` to run unit tests                      |
| test:integration | Uses `jest` to run tests under `/test/integration` |
| test:unit        | Uses `jest` to run tests under `/test/unit`        |

[docs]: https://docs.theqrl.org/
[repo]: https://github.com/theqrl/web3.js/tree/main/packages/web3-providers-http
[npm-image]: https://img.shields.io/github/package-json/v/theqrl/web3.js/main?filename=packages%2Fweb3-providers-http%2Fpackage.json
[npm-url]: https://npmjs.org/package/@theqrl/web3-providers-http
[downloads-image]: https://img.shields.io/npm/dm/@theqrl/web3-providers-http?label=npm%20downloads
