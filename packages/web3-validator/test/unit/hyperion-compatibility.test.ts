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

import { Web3Validator } from '../../src/web3_validator';
import { isInt, isUInt } from '../../src/validation/numbers';

describe('Hyperion ABI compatibility', () => {
	const validator = new Web3Validator();

	it('validates bare ABI integers with 512-bit bounds', () => {
		const maxUint = (BigInt(1) << BigInt(512)) - BigInt(1);
		const minInt = -(BigInt(1) << BigInt(511));
		expect(isUInt(maxUint)).toBe(true);
		expect(isUInt(maxUint + BigInt(1))).toBe(false);
		expect(isUInt(maxUint, { abiType: 'uint' })).toBe(true);
		expect(isInt(minInt)).toBe(true);
		expect(isInt(minInt - BigInt(1))).toBe(false);
		expect(isInt(-minInt)).toBe(false);
		expect(() => validator.validate(['uint', 'int'], [maxUint, minInt])).not.toThrow();
		expect(() => validator.validate(['uint'], [maxUint + BigInt(1)])).toThrow();
		expect(() => validator.validate(['int[]'], [[-minInt]])).toThrow();
	});

	it('keeps explicit 256-bit integers at 256 bits', () => {
		const maxUint256 = (BigInt(1) << BigInt(256)) - BigInt(1);
		expect(() => validator.validate(['uint256'], [maxUint256])).not.toThrow();
		expect(() => validator.validate(['uint256'], [maxUint256 + BigInt(1)])).toThrow();
		expect(isUInt(maxUint256 + BigInt(1), { abiType: 'uint256' })).toBe(false);
		expect(isUInt(maxUint256 + BigInt(1), { bitSize: 256 })).toBe(false);
		expect(isInt(BigInt(1) << BigInt(255), { abiType: 'int256' })).toBe(false);
	});

	it('still accepts explicit 512-bit integers', () => {
		const wide = BigInt(1) << BigInt(400);
		expect(() => validator.validate(['uint512', 'int512'], [wide, -wide])).not.toThrow();
		expect(() => validator.validate(['number', 'blockNumber'], [wide, wide])).not.toThrow();
	});

	it('accepts compact function values as hex strings or byte arrays, including arrays', () => {
		const pointer = `0x${'ab'.repeat(68)}`;
		expect(() =>
			validator.validate(
				['function', 'function', 'function[]', ['function', 'bytes']],
				[pointer, new Uint8Array(68), [pointer], [pointer, '0x0102']],
			),
		).not.toThrow();
	});

	it.each([0, 24, 64, 67, 69, 128])('rejects a %i-byte function value', length => {
		expect(() => validator.validate(['function'], [`0x${'ab'.repeat(length)}`])).toThrow();
	});
});
