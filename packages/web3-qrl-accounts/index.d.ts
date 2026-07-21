/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/*
 * Intentionally empty.
 *
 * This file previously contained shorthand ambient module declarations:
 *
 *     declare module '@theqrl/wallet.js';
 *     declare module '@theqrl/mldsa87';
 *
 * A shorthand ambient declaration (one with no body) types *every* import
 * from that module as `any`, and it takes precedence over the real
 * declarations resolved from node_modules. Both packages do ship accurate
 * typings — `@theqrl/wallet.js` via its `types: types/index.d.ts` entry and
 * `@theqrl/mldsa87` via `types: src/index.d.ts` — so these stubs were
 * silently discarding the post-quantum signing surface's type information
 * and forcing `as unknown as` casts at every call site in src/qrl_wallet.ts
 * and src/qrl_crypto.ts.
 *
 * Do not reintroduce them. If an upstream typing is wrong or missing, fix it
 * upstream or declare the specific missing symbol — never blanket-`any` a
 * cryptographic dependency.
 */
export {};
