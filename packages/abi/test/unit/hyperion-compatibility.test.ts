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

import { arrayify } from '@ethersproject/bytes';
import * as fixture from '../../../../fixtures/abi/hyperion-0.3.1.json';
import { defaultAbiCoder } from '../../src/abi-coder';
import { ErrorFragment, EventFragment, FunctionFragment, ParamType } from '../../src/fragments';

describe('Hyperion 0.3.1 compiler ABI fixtures', () => {
	it.each(fixture.cases.filter(test => !test.packed && !test.panic))(
		'$name matches compiler output and decodes back to the same values',
		({ inputs, values, encoded }) => {
			const types = inputs.map(input => ParamType.from(input));
			expect(defaultAbiCoder.encode(types, values)).toBe(encoded);
			expect(defaultAbiCoder.encode(types, defaultAbiCoder.decode(types, encoded))).toBe(
				encoded,
			);
		},
	);

	it('reads bare uint and int as the full 512-bit word', () => {
		const maxUint = (BigInt(1) << BigInt(512)) - BigInt(1);
		const minInt = -(BigInt(1) << BigInt(511));
		expect(ParamType.from('uint').type).toBe('uint512');
		expect(ParamType.from('int[2][]').type).toBe('int512[2][]');
		expect(defaultAbiCoder.encode(['uint', 'int'], [maxUint, minInt])).toBe(
			defaultAbiCoder.encode(['uint512', 'int512'], [maxUint, minInt]),
		);
		expect(defaultAbiCoder.encode(['uint'], [maxUint])).toHaveLength(2 + 128);
		expect(() => defaultAbiCoder.encode(['uint'], [maxUint + BigInt(1)])).toThrow();
		expect(() => defaultAbiCoder.encode(['int'], [minInt - BigInt(1)])).toThrow();
		expect(() => defaultAbiCoder.encode(['int'], [-minInt])).toThrow();
	});

	it('keeps explicit 256-bit bounds', () => {
		const maxUint = (BigInt(1) << BigInt(256)) - BigInt(1);
		const minInt = -(BigInt(1) << BigInt(255));
		expect(() =>
			defaultAbiCoder.encode(['uint256', 'int256'], [maxUint, minInt]),
		).not.toThrow();
		expect(() => defaultAbiCoder.encode(['uint256'], [maxUint + BigInt(1)])).toThrow();
		expect(() => defaultAbiCoder.encode(['int256'], [minInt - BigInt(1)])).toThrow();
	});

	it('formats every compiler ABI function as its compiler signature', () => {
		const signatures = fixture.abi
			.filter(entry => entry.type === 'function')
			.map(entry => FunctionFragment.from(entry).format());
		expect(signatures.sort()).toEqual(Object.keys(fixture.methodIdentifiers).sort());
	});

	it.each(fixture.calls)('$signature canonicalizes to $canonical', ({ signature, canonical }) => {
		expect(FunctionFragment.from(signature).format()).toBe(canonical);
	});

	it.each(fixture.events)(
		'$signature canonicalizes like the compiler ABI',
		({ signature, abi }) => {
			expect(EventFragment.from(signature).format()).toBe(EventFragment.from(abi).format());
			expect(EventFragment.from(abi).format()).toBe(
				'Indexed(address,bytes64,uint512,int512,string)',
			);
		},
	);

	it('rejects both compiler panic signatures as custom errors', () => {
		expect(() => ErrorFragment.from('Panic(uint512)')).toThrow(/user defined/);
		expect(() => ErrorFragment.from('Panic(uint)')).toThrow(/user defined/);
		expect(() => ErrorFragment.from('Panic(uint256)')).toThrow(/user defined/);
	});

	it('accepts a byte array function value and returns its compact hex representation', () => {
		const pointer = `0x${'12'.repeat(64)}deadbeef`;
		const encoded = defaultAbiCoder.encode(['function'], [arrayify(pointer)]);
		expect(encoded).toBe(`0x${'12'.repeat(64)}${'00'.repeat(60)}deadbeef`);
		expect(defaultAbiCoder.decode(['function'], encoded)[0]).toBe(pointer);
		expect(defaultAbiCoder.getDefaultValue(['function'])[0]).toBe(`0x${'00'.repeat(68)}`);
	});

	it.each([0, 24, 64, 67, 69, 128])('rejects a %i-byte function value', length => {
		expect(() => defaultAbiCoder.encode(['function'], [`0x${'00'.repeat(length)}`])).toThrow();
	});

	it('rejects a truncated function return value', () => {
		expect(() => defaultAbiCoder.decode(['function'], `0x${'00'.repeat(127)}`)).toThrow();
	});
});
