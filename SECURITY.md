# Security Policy

## Supported Versions

This fork is in pre-release cleanup for audit and subsequent release.

| Version | Supported |
| ------- | --------- |
| `main` / unreleased | Yes |
| Published packages before the first audited release | No |

After the first audited release, this table should be updated to list the
supported published release lines.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately to `security@theqrl.org`.

Do not open a public GitHub issue, pull request, discussion, or social-media
thread for a suspected vulnerability. Public disclosure before a fix is
available can increase the risk to users and downstream projects.

Please include as much of the following as possible:

- Affected package name and version, commit, or branch.
- A clear description of the issue and its impact.
- Reproduction steps, proof-of-concept code, logs, or test cases.
- Any known prerequisites or affected environments.
- Whether the issue may affect published packages, `main`, or both.

The QRL team will triage private reports, coordinate fixes, and publish
security advisories or release notes when appropriate.

## Key Material & Memory Security

The secret protected by this library is the wallet **seed** (and the extended seed / mnemonic that
contain it). Anyone with the seed can derive the ML-DSA-87 secret key and sign arbitrary
transactions, so it is critical material.

**JavaScript does not provide guaranteed secure memory handling.** Unlike languages that expose raw
buffers, a JS runtime may keep copies of a secret that the application cannot reach or erase — the
garbage collector may relocate or retain copies, the JIT may materialise additional copies, and the
value may reach swap or a core dump. This is a platform limitation, not a defect in this library, and
it is the same constraint documented for [`@theqrl/wallet.js`](https://github.com/theQRL/wallet.js)
(see its `SECURITY.md` "Memory Security").

**Seeds are held as immutable strings.** `web3.qrl.accounts` exposes the seed as a hex string
(`account.seed`). A JavaScript string is immutable, so — unlike a `Uint8Array` — it **cannot be
zeroized/overwritten** after use. Best-effort scrubbing therefore does not apply to the seed as this
API exposes it; treat any seed string as unrecoverably resident in memory for the process lifetime.

What this library **does** do to reduce accidental exposure:

- `account.seed` is defined **non-enumerable**, so it does not appear in a spread, `Object.keys`, or
  a naive `for…in`.
- `account.toJSON()` **redacts** the seed (`'<redacted>'`), so `JSON.stringify(account)` and most
  loggers will not serialise it.

Recommendations for applications handling seeds:

- **Minimise seed lifetime.** Derive what you need and drop references promptly; do not hold seeds in
  long-lived state, closures, or global caches.
- **Never log or serialise raw seeds.** Rely on the redaction above rather than passing the seed to a
  logger, telemetry, or error report yourself.
- **Prefer the encrypted keystore at rest.** Store seeds as an encrypted V1 keystore (Argon2id +
  AES-256-GCM), never as plaintext.
- **For tighter in-memory control**, operate on the lower-level `Uint8Array`-backed primitives in
  [`@theqrl/wallet.js`](https://github.com/theQRL/wallet.js) and call its `zeroize()` when done —
  understanding that this is **best-effort** protection, not a cryptographic guarantee.
- **For high-value use**, consider a hardware security module, a dedicated signer process, or a
  worker with a constrained lifetime rather than holding seeds in a general-purpose runtime.

## Release Verification

After the first audited release, published packages are expected to be verifiable
through npm provenance, GitHub release artefacts, checksums, SBOMs, GitHub
attestations, and SLSA provenance.

## Scope

This policy covers first-party code in this repository. Dependency security
issues should also be reported upstream to the affected dependency maintainers
when the issue is not caused by this repository's use of that dependency.

For the current audit-prep phase, generated build output, local `node_modules`
directories, local secrets files, and other ignored artefacts are not considered
first-party policy files.
