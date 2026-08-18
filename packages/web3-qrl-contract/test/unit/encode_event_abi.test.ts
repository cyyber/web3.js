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
import { AbiEventFragment, Filter } from '@theqrl/web3-types';
import { isTopic } from '@theqrl/web3-validator';
import { ContractOptions, encodeEventABI } from '../../src';

const contractOptions: ContractOptions = {
	address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
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
	signature: '0x5b5730af07e266d8b4845f404beb3b193085c686b0edd8e8e20cd4b3fc2b6cd50000000000000000000000000000000000000000000000000000000000000000',
};

describe('encodeEventAbi', () => {
	it('should format fromBlock for filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			fromBlock: 10,
		});

		expect(encodedEventFilter).toMatchObject({
			fromBlock: '0xa',
			address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
		});
	});

	it('should format toBlock for filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			toBlock: 10,
		});

		expect(encodedEventFilter).toMatchObject({
			toBlock: '0xa',
			address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
		});
	});

	it('should set topics array for filter to given topics array', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			topics: ['0x3f6d5d7b72c0059e2ecac56fd4adeefb2cff23aa41d13170f78ea6bf81e6e0ca0000000000000000000000000000000000000000000000000000000000000000'],
		});

		expect(encodedEventFilter).toMatchObject({
			topics: ['0x3f6d5d7b72c0059e2ecac56fd4adeefb2cff23aa41d13170f78ea6bf81e6e0ca0000000000000000000000000000000000000000000000000000000000000000'],
			address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
		});
	});

	it('should set filter to get all events for address starting at fromBlock', () => {
		const encodedEventFilter = encodeEventABI(
			contractOptions,
			{
				anonymous: false,
				name: 'ALLEVENTS',
				type: 'event',
				signature: '0x5b5730af07e266d8b4845f404beb3b193085c686b0edd8e8e20cd4b3fc2b6cd50000000000000000000000000000000000000000000000000000000000000000',
			},
			{
				fromBlock: 1000,
			},
		);

		expect(encodedEventFilter).toMatchObject({
			fromBlock: '0x3e8',
			address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
		});
	});

	// Still skipped: an indexed array topic is the hash of an in-place encoding that no
	// component of the stack implements — go-qrl's own `MakeTopics` rejects slices and arrays
	// with "unsupported indexed type", so there is nothing to validate a client-side encoding
	// against. `encodeEventABI` now fails these with that same clear error instead of emitting
	// an unusable ABI blob; see the "dynamic indexed topics" cases below.
	it.skip('should set the filter topics to the keccak256 hash of the provided filter value', () => {
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
			signature: '0x71aefd401e4886a78931d42be506247958b9751348fa91aa2f9dbbd557e9208e0000000000000000000000000000000000000000000000000000000000000000',
		};

		encodeEventABI(contractOptions, _abiEventFragment, {
			filter: {
				vals: [1, 2, 3],
			},
		});
	});

	// Still skipped: an indexed array topic is the hash of an in-place encoding that no
	// component of the stack implements — go-qrl's own `MakeTopics` rejects slices and arrays
	// with "unsupported indexed type", so there is nothing to validate a client-side encoding
	// against. `encodeEventABI` now fails these with that same clear error instead of emitting
	// an unusable ABI blob; see the "dynamic indexed topics" cases below.
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
			signature: '0x9b5a12617e7ca791109ef5e09b8cc23cb4034e0e3dfb4aadac37b55fd28718f60000000000000000000000000000000000000000000000000000000000000000',
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
				'0x5b5730af07e266d8b4845f404beb3b193085c686b0edd8e8e20cd4b3fc2b6cd50000000000000000000000000000000000000000000000000000000000000000',
				'0x3f6d5d7b72c0059e2ecac56fd4adeefb2cff23aa41d13170f78ea6bf81e6e0ca0000000000000000000000000000000000000000000000000000000000000000',
				// eslint-disable-next-line no-null/no-null
				null,
				// eslint-disable-next-line no-null/no-null
				null,
			],
			address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
		});
	});

	it('should filter by the provided bool filter', () => {
		const encodedEventFilter = encodeEventABI(contractOptions, abiEventFragment, {
			filter: {
				flag: true,
			},
		});

		expect(encodedEventFilter).toMatchObject({
			topics: [
				'0x5b5730af07e266d8b4845f404beb3b193085c686b0edd8e8e20cd4b3fc2b6cd50000000000000000000000000000000000000000000000000000000000000000',
				// eslint-disable-next-line no-null/no-null
				null,
				// eslint-disable-next-line no-null/no-null
				null,
				'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
			],
			address: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b295669a9fd93d5f28d9ec85e40f4cb697bae',
		});
	});

	describe('full-width indexed topics', () => {
		// Only dynamic (`string`) indexed arguments are topic-encoded as a left-aligned Keccak
		// hash. Value types go through `encodeParameter`, which already emits a complete 64-byte
		// VM64 word, and must reach the filter untouched — no extra padding, no hashing, no
		// truncation. The three cases below pin the three distinct word layouts:
		//
		//   address  fills the word exactly (go-qrl `common.AddressToLogTopic`; AddressLength
		//            and LogTopicLength are both 64)
		//   bytes32  occupies the HIGH 32 bytes  (go-qrl `common.BytesToLeftAlignedLogTopic`)
		//   uint256  occupies the LOW 32 bytes   (go-qrl `common.BytesToRightAlignedLogTopic`)
		const fullWidthEventFragment: AbiEventFragment & { signature: string } = {
			anonymous: false,
			inputs: [
				{ indexed: true, internalType: 'address', name: 'addr', type: 'address' },
				{ indexed: true, internalType: 'bytes32', name: 'raw', type: 'bytes32' },
				{ indexed: true, internalType: 'uint256', name: 'num', type: 'uint256' },
			],
			name: 'FullWidthIndexedEvent',
			type: 'event',
			// keccak256('FullWidthIndexedEvent(address,bytes32,uint256)'), left-aligned
			signature: `0x97c5ccfdf7b4e603439018c6dd07f746b27292edb629a88b9cec2beaa515dc5b${'0'.repeat(
				64,
			)}`,
		};
		// The maximum address: every byte of the topic word is significant, so any stray
		// padding, truncation or re-alignment of the value shows up immediately.
		const maxAddress = `Q${'ff'.repeat(64)}`;
		const maxUint256 = (BigInt(2) ** BigInt(256) - BigInt(1)).toString();

		const topicsFor = (filter: Filter['filter']) =>
			encodeEventABI(contractOptions, fullWidthEventFragment, { filter }).topics ?? [];

		it('should pass an indexed address through as the exact 64-byte topic word', () => {
			expect(topicsFor({ addr: maxAddress })[1]).toBe(`0x${'ff'.repeat(64)}`);
		});

		it('should left-align an indexed bytes32 in the topic word', () => {
			expect(topicsFor({ raw: `0x${'ff'.repeat(32)}` })[2]).toBe(
				`0x${'ff'.repeat(32)}${'0'.repeat(64)}`,
			);
		});

		it('should right-align an indexed uint256 in the topic word', () => {
			expect(topicsFor({ num: maxUint256 })[3]).toBe(`0x${'0'.repeat(64)}${'ff'.repeat(32)}`);
		});

		it('should emit every topic at the full 64-byte width', () => {
			const topics = topicsFor({ addr: maxAddress, raw: `0x${'ff'.repeat(32)}`, num: 1 });

			expect(topics).toHaveLength(4);
			topics.forEach(topic => {
				expect(isTopic(topic as string)).toBe(true);
			});
		});
	});

	describe('dynamic indexed topics', () => {
		// go-qrl's `accounts/abi.MakeTopics` hashes exactly two indexed kinds into a topic:
		// `string` and `[]byte`, both through `common.HashToLogTopic`. Anything else that is not
		// a value type — dynamic slices, fixed-size arrays of non-byte elements, structs — it
		// rejects with "unsupported indexed type", and `ParseTopics` refuses a tuple outright.
		const dynamicEventFragment: AbiEventFragment & { signature: string } = {
			anonymous: false,
			inputs: [
				{ indexed: true, internalType: 'bytes', name: 'blob', type: 'bytes' },
				{ indexed: true, internalType: 'string', name: 'str', type: 'string' },
			],
			name: 'MixedIndexedEvent',
			type: 'event',
			// keccak256('MixedIndexedEvent(bytes,string)'), left-aligned
			signature: `0xc94cd7f80862704b9f87392344fc93693edb60dc685dc8cc7a3b4d56e7846381${'0'.repeat(
				64,
			)}`,
		};
		// keccak256 hex-decodes a 0x-prefixed string before hashing, so this is the hash of the
		// four raw bytes — the same bytes the node hashes for a `[]byte` filter value.
		const hashedBlob = `0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1${'0'.repeat(
			64,
		)}`;
		const hashedStr = `0x3f6d5d7b72c0059e2ecac56fd4adeefb2cff23aa41d13170f78ea6bf81e6e0ca${'0'.repeat(
			64,
		)}`;

		const topicsFor = (filter: Filter['filter']) =>
			encodeEventABI(contractOptions, dynamicEventFragment, { filter }).topics ?? [];

		it('should hash an indexed bytes filter into a left-aligned topic', () => {
			expect(topicsFor({ blob: '0xdeadbeef' })[1]).toBe(hashedBlob);
		});

		it('should emit a single-word topic for an indexed bytes filter', () => {
			expect(isTopic(topicsFor({ blob: '0xdeadbeef' })[1] as string)).toBe(true);
		});

		it('should hash every alternative of an "or" filter on a dynamic type', () => {
			const topics = topicsFor({ blob: '0xdeadbeef', str: ['str4', 'str4'] });

			expect(topics[1]).toBe(hashedBlob);
			expect(topics[2]).toStrictEqual([hashedStr, hashedStr]);
		});

		it.each(['uint256[]', 'string[]', 'uint256[3]', 'tuple'])(
			'should reject an indexed %s filter the way the node does',
			type => {
				const fragment: AbiEventFragment & { signature: string } = {
					...dynamicEventFragment,
					inputs: [{ indexed: true, internalType: type, name: 'vals', type }],
				};

				expect(() =>
					encodeEventABI(contractOptions, fragment, { filter: { vals: 1 } }),
				).toThrow(`Unsupported indexed filter type: ${type}`);
			},
		);
	});
});
