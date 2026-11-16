# Hyperion ABI compatibility fixtures

`hyperion-0.3.1.json` holds ABI conformance vectors for Hyperion 0.3.1. It
replaces `hyperion-0.2.0.json`, which go-qrl still carries as
`accounts/abi/testdata/hyperion-0.2.0.json`. The `cases` array keeps the shape go-qrl's
`TestHyperionABICompatibility` reads. go-qrl can adopt this file once that test
expects the `Panic(uint512)` selector `0xdf75fb3b` and `abi.UnpackRevert`
decodes it; every other case already passes there.

The fixture was compiled from `AbiCompatibility.hyp` using
`0.3.1+commit.f8af5b22.Emscripten.clang` with optimization enabled (200 runs).
The complete compiler input, the compiler's ABI, the deployed bytecode and the
method selectors are stored in the JSON. Every expected byte was obtained by
executing that bytecode in go-qrl's VM at the commit named in `vm`
(`f3864c46b3f94662c514105da1efaf3466394fae`). None comes from an SDK encoder.

To regenerate, edit `AbiCompatibility.hyp` or the case list in
`scripts/abi-fixture/generate.js` and run, with Go and a go-qrl checkout:

```bash
node scripts/abi-fixture/generate.js ../go-qrl
```

The script compiles the source with the pinned `@theqrl/hypc`, takes selectors
from `qrvm.methodIdentifiers` and executes every call with `runtime.Execute`
and a gas limit of 10,000,000, each against empty state. The go-qrl checkout is
not modified: `scripts/abi-fixture/run_vm.go` is compiled into it through a
build overlay. Call arguments are written by hand in the script, one 64-byte
word at a time.

| Key      | Content                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cases`  | Methods that return `bytes`. `encoded` is the compiler's `abi.encode` or `abi.encodePacked` output (`packed: true`) with the outer encoding of the return value removed. Panic cases (`panic: true`) store the raw revert payload.          |
| `calls`  | Methods with arguments. `signature` uses bare `uint` and `int`; `canonical` is the compiler's signature. `callData` is the selector and arguments, `returned` the raw return data. `echo` returns `abi.encode` of the arguments it decoded. |
| `errors` | The raw revert payload of a custom error and of `Error(string)`.                                                                                                                                                                            |
| `events` | The 64-byte topics and the data of an event with indexed `address`, `bytes64` and `uint` parameters.                                                                                                                                        |

The cases cover bare `uint` and `int` as 512-bit integers, explicit 256-bit
and 512-bit integers, external function values with dynamic arguments, fixed
and dynamic function arrays, functions in dynamic tuples, packed scalars and
arrays, public getters with full-word indices and wide mapping keys, custom
errors, `Error(string)`, events with 64-byte topics and the compiler panics
`0x01`, `0x12` and `0x32`.

Contracts compiled by Hyperion 0.2.0 read bare `uint` and `int` as 256 bits
and raise `Panic(uint256)` (`0x4e487b71`). web3.js still decodes that panic;
`packages/web3-qrl-abi/test/unit/hyperion-compatibility.test.ts` holds its
vector.
