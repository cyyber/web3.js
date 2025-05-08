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

/* eslint-disable jest/expect-expect */

import { expectTypeOf, typecheck } from '@humeris/espresso-shot';
import { Numbers } from '@theqrl/web3-types';
import { Contract } from '../../src/contract';
import { zrc20Abi, Zrc20Interface } from '../fixtures/zrc20';
import { zrc721Abi, Zrc721Interface } from '../fixtures/zrc721';
import { NonPayableMethodObject, PayableMethodObject } from '../../src';

describe('contract typing', () => {
	describe('custom abi', () => {
		const abi = [
			{
				inputs: [
					{
						internalType: 'string',
						name: 'tokenId',
						type: 'string',
					},
				],
				name: 'tokenURI',
				outputs: [{ internalType: 'string', name: '', type: 'string' }],
				stateMutability: 'view',
				type: 'function',
			},
		] as const;
		const contractInstance = new Contract(abi);
		interface CustomInterface {
			methods: {
				[key: string]: (
					...args: ReadonlyArray<any>
				) =>
					| PayableMethodObject<ReadonlyArray<unknown>, ReadonlyArray<unknown>>
					| NonPayableMethodObject<ReadonlyArray<unknown>, ReadonlyArray<unknown>>;
				tokenURI: (tokenId: Numbers) => NonPayableMethodObject<[Numbers], [string]>;
			};
		}

		typecheck('should contain all methods', () =>
			expectTypeOf<keyof typeof contractInstance.methods>().toBe<
				keyof CustomInterface['methods']
			>(),
		);
	});
	describe('zrc20', () => {
		const contract = new Contract(zrc20Abi);

		typecheck('should contain all methods', () =>
			expectTypeOf<keyof typeof contract.methods>().toBe<keyof Zrc20Interface['methods']>(),
		);

		typecheck('should have interface compliance methods', () =>
			expectTypeOf(contract.methods).toExtend<Zrc20Interface['methods']>(),
		);

		typecheck('should have all events', () =>
			expectTypeOf<keyof typeof contract.events>().toBe<keyof Zrc20Interface['events']>(),
		);

		typecheck('should have interface compliance events', () =>
			expectTypeOf(contract.events).toExtend<Zrc20Interface['events']>(),
		);
	});

	describe('zrc721', () => {
		const contract = new Contract(zrc721Abi);

		typecheck('should contain all methods', () =>
			expectTypeOf<keyof typeof contract.methods>().toBe<keyof Zrc721Interface['methods']>(),
		);

		// TODO: It's not matching types for `safeTransferFrom` because of overloaded method
		// typecheck('should have interface compliance methods', () =>
		// 	expectTypeOf(contract.methods).toExtend<Zrc721Interface['methods']>(),
		// );

		typecheck('should have all events', () =>
			expectTypeOf<keyof typeof contract.events>().toBe<keyof Zrc721Interface['events']>(),
		);

		typecheck('should have interface compliance events', () =>
			expectTypeOf(contract.events).toExtend<Zrc721Interface['events']>(),
		);
	});
});
