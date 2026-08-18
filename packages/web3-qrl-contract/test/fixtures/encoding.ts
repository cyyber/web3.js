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
import { AbiEventFragment, LogsInput } from '@theqrl/web3-types';

// Every log below is shaped the way a node serializes one: topics are complete 64-byte VM64
// words, and a 32-byte event signature hash is left-aligned within its topic (go-qrl
// `common.HashToLogTopic`). The `data` payloads are the current coder's own output for the
// argument values named in each case, so the expectations are a genuine round trip.
//
// Indexed topics are covered by decode_event_abi.test.ts; these cases exercise what that file
// does not: unindexed argument decoding, the duplicate-parameter-name collision, and both
// anonymous-event paths.

const address =
	'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000002d029a4bd792d795f35e0583f64ed9dedebba849';
const blockHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
const transactionHash = '0x2222222222222222222222222222222222222222222222222222222222222222';

// keccak256('EventNotAnonymous(string,uint256,string)'), left-aligned in a 64-byte topic
const eventNotAnonymousSignature =
	'0xcdd64e21188ce734deab788895a45d282435991432cf0030e49e95d06f860ee20000000000000000000000000000000000000000000000000000000000000000';

// encodeParameters(['string', 'uint256', 'string'], ['a', 24, 'c'])
const unindexedData =
	'0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000163000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

// encodeParameters(['string', 'uint8', 'uint256'], ['hello', 12, 192])
const anonymousData =
	'0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000568656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const anonymousInputs = [
	{ name: 'a', type: 'string', indexed: false },
	{ name: 'b', type: 'uint8', indexed: false },
	{ name: 'c', type: 'uint256', indexed: false },
];

const anonymousLog: LogsInput = {
	address,
	blockHash,
	blockNumber: '0x19',
	logIndex: '0x1',
	transactionHash,
	transactionIndex: '0x0',
	topics: [],
	data: anonymousData,
};

const anonymousResult = {
	address,
	blockHash,
	blockNumber: BigInt(25),
	logIndex: BigInt(1),
	transactionHash,
	transactionIndex: BigInt(0),
	topics: [],
	data: anonymousData,
	returnValues: {
		'0': 'hello',
		'1': BigInt(12),
		'2': BigInt(192),
		__length__: 3,
		a: 'hello',
		b: BigInt(12),
		c: BigInt(192),
	},
	event: '',
	signature: undefined,
	raw: { data: anonymousData, topics: [] },
};

export const decodeEventABIData: [
	string,
	AbiEventFragment & { signature: string },
	LogsInput,
	any,
][] = [
	[
		'a non-anonymous event whose arguments are all unindexed, with a duplicated name',
		{
			type: 'event',
			name: 'EventNotAnonymous',
			signature: eventNotAnonymousSignature,
			inputs: [
				{ name: 'a', type: 'string', indexed: false },
				{ name: 'b', type: 'uint256', indexed: false },
				{ name: 'a', type: 'string', indexed: false },
			],
		},
		{
			address,
			blockHash,
			blockNumber: '0x19',
			logIndex: '0x1',
			transactionHash,
			transactionIndex: '0x0',
			topics: [eventNotAnonymousSignature],
			data: unindexedData,
		},
		{
			address,
			blockHash,
			blockNumber: BigInt(25),
			logIndex: BigInt(1),
			transactionHash,
			transactionIndex: BigInt(0),
			topics: [eventNotAnonymousSignature],
			data: unindexedData,
			returnValues: {
				'0': 'a',
				'1': BigInt(24),
				'2': 'c',
				__length__: 3,
				// the second parameter named 'a' shadows the first
				a: 'c',
				b: BigInt(24),
			},
			event: 'EventNotAnonymous',
			signature: eventNotAnonymousSignature,
			raw: { data: unindexedData, topics: [eventNotAnonymousSignature] },
		},
	],
	[
		'an anonymous event declared with the anonymous flag',
		{
			type: 'event',
			name: '',
			signature: eventNotAnonymousSignature,
			anonymous: true,
			inputs: anonymousInputs,
		},
		anonymousLog,
		anonymousResult,
	],
	[
		'an event without the anonymous flag that carries no topics',
		{
			type: 'event',
			name: '',
			signature: eventNotAnonymousSignature,
			inputs: anonymousInputs,
		},
		anonymousLog,
		anonymousResult,
	],
];
