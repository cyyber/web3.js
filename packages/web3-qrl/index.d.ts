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
 * This file previously contained a shorthand ambient module declaration:
 *
 *     declare module '@theqrl/wallet.js';
 *
 * Nothing in this package imports `@theqrl/wallet.js`, so the stub was dead
 * weight. It was also a latent trap: a shorthand ambient declaration types
 * every import from the module as `any` and overrides the real typings that
 * `@theqrl/wallet.js` ships, so the first call site added here would have
 * silently lost all type checking on the post-quantum signing surface.
 *
 * Do not reintroduce it. See packages/web3-qrl-accounts/index.d.ts.
 */
export {};
