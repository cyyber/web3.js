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

import { Web3Context, Web3ContextObject } from '@theqrl/web3-core';
import { NonPayableMethodObject } from '@theqrl/web3-zond-contract';
import { Registry } from '../../src/registry';
import { namehash } from '../../src/utils';

describe('registry', () => {
	let object: Web3ContextObject;
	let registry: Registry;
	const mockAddress = 'Z0000000000000000000000000000000000000000';
	const ZNS_NAME = 'web3js.znd';

	beforeAll(() => {
		const context = new Web3Context('http://test.com');
		object = context.getContextObject();

		registry = new Registry(object);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('constructor with custom address', async () => {
		const tempRegistry = new Registry(object, mockAddress);

		expect(tempRegistry).toBeInstanceOf(Registry);
	});

	describe('owner', () => {
		it('getOwner', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call');

			const getOwnerMock = jest.spyOn(registry['contract'].methods, 'owner').mockReturnValue({
				call,
			} as unknown as NonPayableMethodObject<any, any>);

			await registry.getOwner(ZNS_NAME);
			expect(getOwnerMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
		it('getOwner throw (transaction reverted)', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call').mockImplementation(() => {
				throw new Error();
			});

			const getOwnerMock = jest
				.spyOn(registry['contract'].methods, 'owner')
				.mockReturnValue({ call } as unknown as NonPayableMethodObject<any, any>);

			await expect(async () => {
				await registry.getOwner(ZNS_NAME);
			}).rejects.toThrow(new Error());
			expect(getOwnerMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
	});

	describe('ttl', () => {
		it('getTTL', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call');

			const getTTLMock = jest.spyOn(registry['contract'].methods, 'ttl').mockReturnValue({
				call,
			} as unknown as NonPayableMethodObject<any, any>);

			await registry.getTTL(ZNS_NAME);
			expect(getTTLMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
		it('getTTL throw (transaction reverted)', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call').mockImplementation(() => {
				throw new Error();
			});

			const getTTLMock = jest
				.spyOn(registry['contract'].methods, 'ttl')
				.mockReturnValue({ call } as unknown as NonPayableMethodObject<any, any>);

			await expect(async () => {
				await registry.getTTL(ZNS_NAME);
			}).rejects.toThrow(new Error());
			expect(getTTLMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
	});

	describe('record', () => {
		it('recordExists', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call');

			const setRecordMock = jest
				.spyOn(registry['contract'].methods, 'recordExists')
				.mockReturnValue({
					call,
				} as unknown as NonPayableMethodObject<any, any>);

			await registry.recordExists(ZNS_NAME);
			expect(setRecordMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
		it('recordExists throw (transaction reverted)', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call').mockImplementation(() => {
				throw new Error();
			});

			const setRecordMock = jest
				.spyOn(registry['contract'].methods, 'recordExists')
				.mockReturnValue({
					call,
				} as unknown as NonPayableMethodObject<any, any>);

			await expect(async () => {
				await registry.recordExists(ZNS_NAME);
			}).rejects.toThrow(new Error());
			expect(setRecordMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
	});

	describe('resolver', () => {
		it('resolver', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest
				.spyOn(
					{
						call: async () => {
							return mockAddress;
						},
					},
					'call',
				)
				.mockReturnValue(Promise.resolve(mockAddress));

			const resolverMock = jest
				.spyOn(registry['contract'].methods, 'resolver')
				.mockReturnValue({
					call,
				} as unknown as NonPayableMethodObject<any, any>);

			await registry.getResolver(ZNS_NAME);
			expect(resolverMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});

		it('resolver (return non string)', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest
				.spyOn(
					{
						call: async () => {
							return 5; // something that is not string
						},
					},
					'call',
				)
				.mockReturnValue(Promise.resolve(5)); // something that is not string

			const resolverMock = jest
				.spyOn(registry['contract'].methods, 'resolver')
				.mockReturnValue({
					call,
				} as unknown as NonPayableMethodObject<any, any>);

			await expect(async () => {
				await registry.getResolver(ZNS_NAME);
			}).rejects.toThrow(new Error());
			expect(resolverMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});

		it('resolver throw (transaction reverted)', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const call = jest.spyOn({ call: () => {} }, 'call').mockImplementation(() => {
				throw new Error();
			});
			const resolverMock = jest
				.spyOn(registry['contract'].methods, 'resolver')
				.mockReturnValue({
					call,
				} as unknown as NonPayableMethodObject<any, any>);

			await expect(async () => {
				await registry.getResolver(ZNS_NAME);
			}).rejects.toThrow(new Error());
			expect(resolverMock).toHaveBeenCalledWith(namehash(ZNS_NAME));
			expect(call).toHaveBeenCalled();
		});
	});
});
