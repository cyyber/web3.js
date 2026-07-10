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
import { id } from '@ethersproject/hash';
import { AbiCoder, Interface } from '../../src';

describe('VM64 ABI', () => {
	const coder = new AbiCoder();

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

	it('rejects non-canonical integer padding', () => {
		const malformedUint256 = `0x01${'00'.repeat(62)}01`;
		const malformedInt256 = `0x${'00'.repeat(32)}${'ff'.repeat(32)}`;

		expect(() => coder.decode(['uint256'], malformedUint256)[0]).toThrow('non-canonical value');
		expect(() => coder.decode(['int256'], malformedInt256)[0]).toThrow('non-canonical value');
	});

	it('serializes hashes and accepts precomputed composite filter topics', () => {
		const eventHash = `0x${'12'.repeat(32)}`;
		const context = { _abiCoder: coder, getEventTopic: () => eventHash };
		const encodeFilterTopics = Interface.prototype.encodeFilterTopics as any;
		const stringEvent = {
			anonymous: false,
			inputs: [{ baseType: 'string', indexed: true, name: 'label', type: 'string' }],
		};

		expect(encodeFilterTopics.call(context, stringEvent, ['0x1234'])).toEqual([
			`${eventHash}${'0'.repeat(64)}`,
			`${id('0x1234')}${'0'.repeat(64)}`,
		]);

		const precomputed = `0x${'ab'.repeat(64)}`;
		const arrayEvent = {
			anonymous: false,
			inputs: [{ baseType: 'array', indexed: true, name: 'values', type: 'uint256[]' }],
		};
		expect(encodeFilterTopics.call(context, arrayEvent, [precomputed])).toEqual([
			`${eventHash}${'0'.repeat(64)}`,
			precomputed,
		]);
		expect(() => encodeFilterTopics.call(context, arrayEvent, [[1, 2]])).toThrow(
			'require precomputed 64-byte topics',
		);
	});
});
