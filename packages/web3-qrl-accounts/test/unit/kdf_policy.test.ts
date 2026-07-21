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

import { ARGON2ID_BOUNDS, validateArgon2idParams } from '../../src/kdf_policy';

describe('kdf_policy', () => {
	describe('validateArgon2idParams', () => {
		it('exposes an OWASP-compliant Argon2id memory floor', () => {
			// OWASP Argon2id floor: m >= 19456 (19 MiB), t >= 2.
			expect(ARGON2ID_BOUNDS.m.min).toBe(19456);
			expect(ARGON2ID_BOUNDS.t.min).toBeGreaterThanOrEqual(2);
		});

		it('rejects m below the OWASP floor', () => {
			expect(() =>
				validateArgon2idParams({ m: 8192, t: 8, p: 1, dklen: 32 }),
			).toThrow(/Argon2id m out of range/);
		});

		it('rejects m at the previous 4096 minimum', () => {
			expect(() =>
				validateArgon2idParams({ m: 4096, t: 8, p: 1, dklen: 32 }),
			).toThrow(/Argon2id m out of range/);
		});

		it('accepts m at the OWASP floor', () => {
			expect(() =>
				validateArgon2idParams({ m: 19456, t: 8, p: 1, dklen: 32 }),
			).not.toThrow();
		});

		it('accepts the strong encrypt defaults', () => {
			expect(() =>
				validateArgon2idParams({ m: 262144, t: 8, p: 1, dklen: 32 }),
			).not.toThrow();
		});
	});
});
