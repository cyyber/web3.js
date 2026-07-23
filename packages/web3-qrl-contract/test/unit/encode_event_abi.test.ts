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
import { AbiEventFragment } from '@theqrl/web3-types';
import { ContractOptions, encodeEventABI } from '../../src';

const contractOptions: ContractOptions = {
	address:
		'Qd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72',
} as ContractOptions;
const abiEventFragment: AbiEventFragment & { signature: string } = {
	anonymous: false,
	inputs: [
		{
			indexed: true,
			internalType: 'string',
			name: 'str',
			type: 'string',
		},
		{
			indexed: true,
			internalType: 'uint256',
			name: 'val',
			type: 'uint256',
		},
		{
			indexed: true,
			internalType: 'bool',
			name: 'flag',
			type: 'bool',
		},
	],
	name: 'MultiValueIndexedEventWithStringIndexed',
	type: 'event',
	signature: '0x5b5730af07e266d8b4845f404beb3b193085c686b0edd8e8e20cd4b3fc2b6cd5',
};
const signatureTopic = `${abiEventFragment.signature}${'0'.repeat(64)}`;
const contractAddress = contractOptions.address
	? `Q${contractOptions.address.slice(1).toLowerCase()}`
	: undefined;

describe('encodeEventAbi', () => {
	it('should format fromBlock for filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			fromBlock: 10,
		});

		expect(encodedEventFilter).toMatchObject({
			fromBlock: '0xa',
			address: contractAddress,
		});
	});

	it('should format toBlock for filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			toBlock: 10,
		});

		expect(encodedEventFilter).toMatchObject({
			toBlock: '0xa',
			address: contractAddress,
		});
	});

	it('should set topics array for filter to given topics array', () => {
		const topic = `0x${'3f'.repeat(64)}`;
		const alternateTopic = `0x${'a7'.repeat(64)}`;
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			// eslint-disable-next-line no-null/no-null
			topics: [topic, null, [topic, alternateTopic]],
		});

		expect(encodedEventFilter).toMatchObject({
			// eslint-disable-next-line no-null/no-null
			topics: [topic, null, [topic, alternateTopic]],
			address: contractAddress,
		});
	});

	it('should set filter to get all events for address starting at fromBlock', () => {
		const encodedEventFilter = encodeEventABI(
			contractOptions,
			{
				anonymous: false,
				name: 'ALLEVENTS',
				type: 'event',
				signature: '0x5b5730af07e266d8b4845f404beb3b193085c686b0edd8e8e20cd4b3fc2b6cd5',
			},
			{
				fromBlock: 1000,
			},
		);

		expect(encodedEventFilter).toMatchObject({
			fromBlock: '0x3e8',
			address: contractAddress,
		});
	});

	it('should require precomputed topics for indexed arrays', () => {
		const _abiEventFragment: AbiEventFragment & { signature: string } = {
			anonymous: false,
			inputs: [
				{
					indexed: true,
					internalType: 'uint256[]',
					name: 'vals',
					type: 'uint256[]',
				},
			],
			name: 'IndexedArrayEvent',
			type: 'event',
			signature: '0x71aefd401e4886a78931d42be506247958b9751348fa91aa2f9dbbd557e9208e',
		};

		expect(() =>
			encodeEventABI(contractOptions, _abiEventFragment, {
				filter: { vals: [1, 2, 3] },
			}),
		).toThrow('requires precomputed 64-byte topics');

		const precomputed = `0x${'ab'.repeat(64)}`;
		expect(
			encodeEventABI(contractOptions, _abiEventFragment, {
				filter: { vals: precomputed },
			}),
		).toMatchObject({
			topics: [`${_abiEventFragment.signature}${'0'.repeat(64)}`, precomputed],
		});
	});

	// This test fails because encoding of a dynamic sized array is not current supported
	// Received error: AbiError: Parameter encoding error
	it.skip('should set the filter topics', () => {
		const _abiEventFragment: AbiEventFragment & { signature: string } = {
			anonymous: false,
			inputs: [
				{
					indexed: true,
					internalType: 'uint256[]',
					name: 'vals',
					type: 'uint256[]',
				},
				{
					indexed: true,
					internalType: 'string[]',
					name: 'strs',
					type: 'string[]',
				},
				{
					indexed: true,
					internalType: 'bool[]',
					name: 'flags',
					type: 'bool[]',
				},
			],
			name: 'IndexedMultiValArrayEvent',
			type: 'event',
			signature: '0x9b5a12617e7ca791109ef5e09b8cc23cb4034e0e3dfb4aadac37b55fd28718f6',
		};

		encodeEventABI(contractOptions, _abiEventFragment, {
			filter: {
				vals: [1, 2, 3],
			},
		});
	});

	it('should filter by the keccak256 of the provided indexed string filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			filter: {
				str: 'str4',
			},
		});

		expect(encodedEventFilter).toMatchObject({
			topics: [
				signatureTopic,
				`0x3f6d5d7b72c0059e2ecac56fd4adeefb2cff23aa41d13170f78ea6bf81e6e0ca${'0'.repeat(
					64,
				)}`,
				// eslint-disable-next-line no-null/no-null
				null,
				// eslint-disable-next-line no-null/no-null
				null,
			],
			address: contractAddress,
		});
	});

	it('should hash hex-looking indexed strings as UTF-8 text', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			filter: { str: '0x1234' },
		});

		expect(encodedEventFilter.topics?.[1]).toBe(
			`0x1ac7d1b81b7ba1025b36ccb86723da6ee5a87259f1c2fd5abe69d3200b512ec8${'0'.repeat(64)}`,
		);
	});

	it('should filter by the provided bool filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			filter: {
				flag: true,
			},
		});

		expect(encodedEventFilter).toMatchObject({
			topics: [
				signatureTopic,
				// eslint-disable-next-line no-null/no-null
				null,
				// eslint-disable-next-line no-null/no-null
				null,
				'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
			],
			address: contractAddress,
		});
	});

	it('should preserve every byte of an indexed address', () => {
		const addressEvent: AbiEventFragment & { signature: string } = {
			anonymous: false,
			inputs: [{ indexed: true, name: 'account', type: 'address' }],
			name: 'AccountChanged',
			type: 'event',
			signature: '0x9ba4be5168d532f74d3233652f1172c4dd712085a615aee3f414846f204db14f',
		};
		const encodedEventFilter = encodeEventABI(contractOptions, addressEvent, {
			filter: { account: contractOptions.address },
		});

		expect(encodedEventFilter.topics?.[1]).toBe(
			`0x${contractOptions.address?.slice(1).toLowerCase()}`,
		);
	});

	it('should encode false and zero instead of treating them as wildcards', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			filter: { val: 0, flag: false },
		});

		expect(encodedEventFilter.topics?.[2]).toBe(`0x${'0'.repeat(128)}`);
		expect(encodedEventFilter.topics?.[3]).toBe(`0x${'0'.repeat(128)}`);
	});

	it('should right-pad an indexed dynamic bytes hash', () => {
		const bytesEvent: AbiEventFragment & { signature: string } = {
			anonymous: false,
			inputs: [{ indexed: true, name: 'payload', type: 'bytes' }],
			name: 'Payload',
			type: 'event',
			signature: '0xdd64d7f331676de21d95ea9f7eb8585b688f72afec29a51ff4502fd5a6ae19e7',
		};
		const encodedEventFilter = encodeEventABI(contractOptions, bytesEvent, {
			filter: { payload: '0x1234' },
		});

		expect(encodedEventFilter.topics?.[1]).toMatch(/^0x[0-9a-f]{64}0{64}$/u);
	});
});
