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
import { AbiCoder, Interface } from '../../src';

describe('VM64 ABI', () => {
	const coder = new AbiCoder();
	const address =
		'Qd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72';

	it('encodes each value in a 64-byte VM word', () => {
		expect(coder.encode(['uint8'], [1])).toBe(`0x${'0'.repeat(127)}1`);
	});

	it('encodes and decodes explicit 512-bit integers', () => {
		const maxUint512 = (BigInt(1) << BigInt(512)) - BigInt(1);
		const minInt512 = -(BigInt(1) << BigInt(511));

		expect(coder.encode(['uint512'], [maxUint512])).toBe(`0x${'f'.repeat(128)}`);
		expect(coder.decode(['uint512'], `0x${'f'.repeat(128)}`)[0].toString()).toBe(
			maxUint512.toString(),
		);
		expect(coder.decode(['int512'], coder.encode(['int512'], [minInt512]))[0].toString()).toBe(
			minInt512.toString(),
		);
		expect(() => coder.encode(['uint512'], [maxUint512 + BigInt(1)])).toThrow(
			'value out-of-bounds',
		);
		expect(() => coder.encode(['int512'], [BigInt(1) << BigInt(511)])).toThrow(
			'value out-of-bounds',
		);
	});

	it('supports fixed bytes through bytes64', () => {
		const value = `0x${'ab'.repeat(64)}`;

		expect(coder.encode(['bytes64'], [value])).toBe(value);
		expect(coder.decode(['bytes64'], value)[0]).toBe(value);
		expect(coder.getDefaultValue(['bytes64'])[0]).toBe(`0x${'00'.repeat(64)}`);
	});

	it('encodes and decodes genuine full-width addresses', () => {
		const encoded = `0x${address.slice(1)}`;

		expect(coder.encode(['address'], [address])).toBe(encoded);
		expect(coder.decode(['address'], encoded)[0]).toBe(address.toLowerCase().replace('q', 'Q'));
		expect(Interface.getAddress(address)).toBe(address);
	});
});
