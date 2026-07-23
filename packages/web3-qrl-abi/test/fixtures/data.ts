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

import { encodeParameters, decodeParameters } from '../../src/api/parameters_api';

// Because Jest does not support BigInt (https://github.com/facebook/jest/issues/12827)
// The BigInt values in this file is in a string format.
// And the following override is to convert BigInt to a string inside the Unit Tests that uses this file,
// 	i.e when serialization is needed there (because the values in this file is in a string format).
(BigInt.prototype as any).toJSON = function () {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
	return this.toString();
};

const addressA =
	'Qd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72';
const addressB =
	'Qbe95a82d87a6cb9c7ff4c64e0c15bb1dff20b1d77e6b571b28ad4736f2a2a3e5857e8c225d6d61399b15beef3b196936e490ed6e234374c4887cbbe86c13b1ba';
const eventSignatureTopic = `0x${'ab'.repeat(32)}${'0'.repeat(64)}`;
const encodedErrorWithParams =
	'0xc85bda600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c5468697320697320616e206572726f72207769746820706172616d73000000000000000000000000000000000000000000000000000000000000000000000000';
const encodedUintString =
	'0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008bd02b7b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000748656c6c6f2125000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const encodedUintArrayBytes32 =
	'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080324567fff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff';
const encodedUintArrayStruct =
	'0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff';
const encodedUintTuple =
	'0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004d2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000162e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b48656c6c6f20576f726c640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const encodedNestedUintArrays =
	'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010';

export const jsonInterfaceValidData: [any, string][] = [
	[
		{
			// testing function type
			name: 'myMethod',
			type: 'function',
			inputs: [
				{
					type: 'uint256',
					name: 'myNumber',
				},
				{
					type: 'string',
					name: 'myString',
				},
			],
		},
		'myMethod(uint256,string)',
	],
	[
		{
			name: 'f',
			type: 'function',
			inputs: [
				{
					name: 's',
					type: 'tuple',
					components: [
						{
							name: 'a',
							type: 'uint256',
						},
						{
							name: 'b',
							type: 'uint256[]',
						},
						{
							name: 'c',
							type: 'tuple[]',
							components: [
								{
									name: 'x',
									type: 'uint256',
								},
								{
									name: 'y',
									type: 'uint256',
								},
							],
						},
					],
				},
				{
					name: 't',
					type: 'tuple',
					components: [
						{
							name: 'x',
							type: 'uint256',
						},
						{
							name: 'y',
							type: 'uint256',
						},
					],
				},
				{
					name: 'a',
					type: 'uint256',
				},
			],
			outputs: [],
		},
		'f((uint256,uint256[],(uint256,uint256)[]),(uint256,uint256),uint256)',
	],
	[
		// testing event type
		{
			type: 'event',
			inputs: [
				{ name: 'a', type: 'uint256', indexed: true },
				{ name: 'b', type: 'bytes32', indexed: false },
			],
			name: 'Event',
		},
		'Event(uint256,bytes32)',
	],
	[
		{
			name: 'myEvent',
			type: 'event',
			inputs: [
				{
					type: 'uint256',
					name: 'myNumber',
				},
				{
					type: 'bytes32',
					name: 'myBytes',
				},
			],
		},
		'myEvent(uint256,bytes32)',
	],
];

export const jsonInterfaceInvalidData: [any, string][] = [
	[
		{
			name: 'f',
			type: 'function',
			inputs: [
				{
					name: 's',
					type: 'notTuple',
					components: [
						{
							name: 'a',
							type: 'uint256',
						},
						{
							name: 'b',
							type: 'uint256[]',
						},
						{
							name: 'c',
							type: 'tuple[]',
							components: [
								{
									name: 'x',
									type: 'uint256',
								},
								{
									name: 'y',
									type: 'uint256',
								},
							],
						},
					],
				},
				{
					name: 't',
					type: 'tuple',
					components: [
						{
							name: 'x',
							type: 'uint256',
						},
						{
							name: 'y',
							type: 'uint256',
						},
					],
				},
				{
					name: 'a',
					type: 'uint256',
				},
			],
			outputs: [],
		},
		'Invalid value given "notTuple". Error: components found but type is not tuple.',
	],
];

export const validFunctionsSignatures: { input: any; output: string }[] = [
	{ input: 'myMethod(uint256,string)', output: '0x24ee0097' },
	{
		input: {
			name: 'myMethod',
			type: 'function' as const,
			inputs: [
				{
					type: 'uint256',
					name: 'myNumber',
				},
				{
					type: 'string',
					name: 'myString',
				},
			],
		},
		output: '0x24ee0097',
	},
];

export const inValidFunctionsSignatures: { input: any; output: string }[] = [
	{ input: 345, output: 'Invalid parameter value in encodeFunctionSignature' },
	{ input: {}, output: 'Invalid parameter value in encodeFunctionSignature' },
	{ input: ['mystring'], output: 'Invalid parameter value in encodeFunctionSignature' },
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	{ input: null, output: 'Invalid parameter value in encodeFunctionSignature' },
	{ input: undefined, output: 'Invalid parameter value in encodeFunctionSignature' },
];

export const validFunctionsCall: { input: { abi: any; params: any }; output: string }[] = [
	{
		input: {
			abi: {
				name: 'myMethod',
				type: 'function',
				inputs: [
					{
						type: 'uint256',
						name: 'myNumber',
					},
					{
						type: 'string',
						name: 'myString',
					},
				],
			},
			params: ['2345675643', 'Hello!%'],
		},
		output: `0x24ee0097${encodedUintString.slice(2)}`,
	},
	{
		input: {
			abi: {
				type: 'function',
				name: 'pour',
				inputs: [
					{
						type: 'bytes12',
						name: 'vaultId_',
					},
					{
						type: 'address',
						name: 'to',
					},
					{
						type: 'int128',
						name: 'ink',
					},
					{
						type: 'int128',
						name: 'art',
					},
				],
			},
			params: [
				'0x000000000000000000000000',
				addressA,
				'170141183460469231731687303715884105727',
				'-170141183460469231731687303715884105727',
			],
		},
		output: '0x99d4294000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b720000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000000000000000000000000001',
	},
];

export const inValidFunctionsCalls: { input: any; output: string }[] = [
	{ input: 345, output: 'Invalid parameter value in encodeFunctionCall' },
	{ input: {}, output: 'Invalid parameter value in encodeFunctionCall' },
	{ input: ['mystring'], output: 'Invalid parameter value in encodeFunctionCall' },
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	{ input: null, output: 'Invalid parameter value in encodeFunctionCall' },
	{ input: undefined, output: 'Invalid parameter value in encodeFunctionCall' },
];

export const validEventsSignatures: { input: any; output: string }[] = [
	{
		input: 'myEvent(uint256,bytes32)',
		output: '0xf2eeb729e636a8cb783be044acf6b7b1e2c5863735b60d6daae84c366ee87d97',
	},
	{
		input: {
			name: 'myEvent',
			type: 'event' as const,
			inputs: [
				{
					type: 'uint256',
					name: 'myNumber',
				},
				{
					type: 'bytes32',
					name: 'myBytes',
				},
			],
		},
		output: '0xf2eeb729e636a8cb783be044acf6b7b1e2c5863735b60d6daae84c366ee87d97',
	},
];

export const invalidEventsSignatures: { input: any; output: string }[] = [
	{ input: 345, output: 'Invalid parameter value in encodeEventSignature' },
	{ input: {}, output: 'Invalid parameter value in encodeEventSignature' },
	{ input: ['mystring'], output: 'Invalid parameter value in encodeEventSignature' },
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	{ input: null, output: 'Invalid parameter value in encodeEventSignature' },
	{ input: undefined, output: 'Invalid parameter value in encodeEventSignature' },
];

export const validErrorsSignatures: { input: any; output: string }[] = [
	{
		input: 'Unauthorized()',
		output: '0x82b4290015f7ec7256ca2a6247d3c2a89c4865c0e791456df195f40ad0a81367',
	},
	{
		input: {
			inputs: [{ internalType: 'string', name: '', type: 'string' }],
			name: 'CustomError',
			type: 'error',
		},
		output: '0x8d6ea8bed4afafaebcad40e72174583b8bf4969c5d3bc84536051f3939bf9d81',
	},
	{
		input: 'Error(string)',
		output: '0x08c379a0afcc32b1a39302f7cb8073359698411ab5fd6e3edb2c02c0b5fba8aa',
	},
];

export const invalidErrorSignatures: { input: any; output: string }[] = [
	{ input: 345, output: 'Invalid parameter value in encodeErrorSignature' },
	{ input: {}, output: 'Invalid parameter value in encodeErrorSignature' },
	{ input: ['mystring'], output: 'Invalid parameter value in encodeErrorSignature' },
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	{ input: null, output: 'Invalid parameter value in encodeErrorSignature' },
	{ input: undefined, output: 'Invalid parameter value in encodeErrorSignature' },
];

const userTupleAbi = {
	components: [
		{ internalType: 'string', name: 'name', type: 'string' },
		{ internalType: 'address', name: 'addr', type: 'address' },
		{
			components: [
				{ internalType: 'string', name: 'email', type: 'string' },
				{ internalType: 'string', name: 'phone', type: 'string' },
			],
			internalType: 'struct ABIV2UserDirectory.Contact',
			name: 'contact',
			type: 'tuple',
		},
	],
	indexed: false,
	internalType: 'struct ABIV2UserDirectory.User',
	name: 'user',
	type: 'tuple',
};
const userTupleValue = {
	name: 'Rick Sanchez',
	addr: addressA,
	contact: {
		email: 'rick.c137@citadel.cfc',
		phone: '+1 (555) 314-1593',
	},
};
const encodedUserTuple =
	'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0d5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5269636b2053616e6368657a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000157269636b2e63313337406369746164656c2e63666300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000112b31202835353529203331342d313539330000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export const validDecodeLogsData: {
	input: { abi: any; data: any; topics: any };
	output: Record<string, unknown>;
}[] = [
	{
		input: {
			abi: [
				{
					type: 'string',
					name: 'myString',
				},
				{
					type: 'uint256',
					name: 'myNumber',
					indexed: true,
				},
				{
					type: 'uint8',
					name: 'mySmallNumber',
					indexed: true,
				},
			],
			data: encodeParameters(['string'], ['Hello%!']),
			topics: [encodeParameters(['uint256'], ['62224']), encodeParameters(['uint8'], ['16'])],
		},
		output: {
			'0': 'Hello%!',
			'1': '62224',
			'2': '16',
			__length__: 3,
			myString: 'Hello%!',
			myNumber: '62224',
			mySmallNumber: '16',
		},
	},
	{
		// testing an anonymous log with 4 params
		input: {
			abi: [
				{
					name: 'myString',
					type: 'string',
				},
				{
					name: 'myNum',
					type: 'uint8',
				},
				{
					name: 'str',
					type: 'string',
				},
				{
					name: 'largerNumber',
					type: 'uint256',
				},
			],
			topics: [],
			data: encodeParameters(
				['string', 'uint8', 'string', 'uint256'],
				['a', '12', 'b', '125'],
			),
		},
		output: {
			'0': 'a',
			'1': '12',
			'2': 'b',
			'3': '125',
			__length__: 4,
			myString: 'a',
			myNum: '12',
			largerNumber: '125',
			str: 'b',
		},
	},
	{
		input: {
			abi: [
				{
					indexed: true,
					name: 'from',
					type: 'address',
				},
				{
					indexed: true,
					name: 'to',
					type: 'address',
				},
				{
					indexed: false,
					name: 'value',
					type: 'uint256',
				},
			],
			topics: [
				eventSignatureTopic,
				encodeParameters(['address'], [addressA]),
				encodeParameters(['address'], [addressB]),
			],
			data: encodeParameters(['uint256'], ['100000']),
		},
		output: {
			'0': addressA,
			'1': addressB,
			'2': '100000',
			__length__: 3,
			from: addressA,
			to: addressB,
			value: '100000',
		},
	},
	{
		input: {
			abi: [
				{ indexed: true, internalType: 'address', name: 'addr', type: 'address' },
				userTupleAbi,
			],
			data: encodeParameters([userTupleAbi], [userTupleValue]),
			topics: [encodeParameters(['address'], [addressA])],
		},
		output: {
			'0': addressA,
			'1': {
				'0': 'Rick Sanchez',
				'1': addressA,
				'2': {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
				__length__: 3,
				name: 'Rick Sanchez',
				addr: addressA,
				contact: {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
			},
			__length__: 2,
			addr: addressA,
			user: {
				'0': 'Rick Sanchez',
				'1': addressA,
				'2': {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
				__length__: 3,
				name: 'Rick Sanchez',
				addr: addressA,
				contact: {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
			},
		},
	},
];

export const validEncodeDecodeParametersData: {
	input: Parameters<typeof encodeParameters>;
	output: ReturnType<typeof encodeParameters>;
	outputResult: any;
}[] = [
	{
		input: [
			['uint256', 'string'],
			['2345675643', 'Hello!%'],
		],
		output: encodedUintString,
		outputResult: {
			'0': '2345675643',
			'1': 'Hello!%',
			__length__: 2,
		},
	},
	{
		input: [
			['uint8[]', 'bytes32'],
			[['34', '255'], '0x324567fff0000000000000000000000000000000000000000000000000000000'],
		],
		output: encodedUintArrayBytes32,
		outputResult: {
			'0': ['34', '255'],
			'1': '0x324567fff0000000000000000000000000000000000000000000000000000000',
			__length__: 2,
		},
	},
	{
		input: [
			[
				'uint8[]',
				{
					ParentStruct: {
						propertyOne: 'uint256',
						propertyTwo: 'uint256',
						ChildStruct: {
							propertyOne: 'uint256',
							propertyTwo: 'uint256',
						},
					},
				},
			],
			[
				['34', '255'],
				{
					propertyOne: '42',
					propertyTwo: '56',
					ChildStruct: {
						propertyOne: '45',
						propertyTwo: '78',
					},
				},
			],
		],
		output: encodedUintArrayStruct,
		outputResult: {
			'0': ['34', '255'],
			'1': {
				'0': '42',
				'1': '56',
				'2': {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				propertyOne: '42',
				propertyTwo: '56',
				ChildStruct: {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				__length__: 3,
			},
			ParentStruct: {
				'0': '42',
				'1': '56',
				'2': {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				propertyOne: '42',
				propertyTwo: '56',
				ChildStruct: {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				__length__: 3,
			},
			__length__: 2,
		},
	},
];

export const validEncodeDoesNotMutateData: {
	expectedInput: unknown[];
	input: Parameters<typeof encodeParameters>;
	output: ReturnType<typeof encodeParameters>;
}[] = [
	{
		expectedInput: [
			['34', '255'],
			{
				propertyOne: ['78', '124'],
				propertyTwo: '56',
				ChildStruct: {
					propertyOne: ['16'],
					propertyTwo: '78',
				},
			},
		],

		input: [
			[
				'uint8[]',
				{
					ParentStruct: {
						propertyOne: 'uint8[]',
						propertyTwo: 'uint256',
						ChildStruct: {
							propertyOne: 'uint8[]',
							propertyTwo: 'uint256',
						},
					},
				},
			],
			[
				['34', '255'],
				{
					propertyOne: ['78', '124'],
					propertyTwo: '56',
					ChildStruct: {
						propertyOne: ['16'],
						propertyTwo: '78',
					},
				},
			],
		],
		output: encodedNestedUintArrays,
	},
];

export const validEncodeParametersData: {
	input: Parameters<typeof encodeParameters>;
	output: ReturnType<typeof encodeParameters>;
}[] = [
	{
		input: [
			['uint256', 'string'],
			['2345675643', 'Hello!%'],
		],
		output: encodedUintString,
	},
	{
		input: [
			['uint8[]', 'bytes32'],
			[['34', '255'], '0x324567fff'],
		],
		output: encodedUintArrayBytes32,
	},
	{
		input: [
			[
				'uint8[]',
				{
					ParentStruct: {
						propertyOne: 'uint256',
						propertyTwo: 'uint256',
						ChildStruct: {
							propertyOne: 'uint256',
							propertyTwo: 'uint256',
						},
					},
				},
			],
			[
				['34', '255'],
				{
					propertyOne: '42',
					propertyTwo: '56',
					ChildStruct: {
						propertyOne: '45',
						propertyTwo: '78',
					},
				},
			],
		],
		output: encodedUintArrayStruct,
	},
	{
		input: [
			['uint', 'tuple(uint256, string)'],
			[1234, [5678, 'Hello World']],
		],
		output: encodedUintTuple,
	},
];

export const inValidEncodeParametersData: {
	input: any[];
	output: string;
}[] = [
	{
		input: [
			['uint8[]', 'bytes32'],
			[['34', '256'], '0x324567fff'],
		],
		output: 'Parameter encoding error',
	},
	{
		input: [345, ['2345675643', 'Hello!%']],
		output: 'Parameter encoding error',
	},
	{
		input: [true, ['2345675643', 'Hello!%']],
		output: 'Parameter encoding error',
	},
	{
		input: [undefined, ['2345675643', 'Hello!%']],
		output: 'Parameter encoding error',
	},
	{
		// Using "null" value intentionally for validation
		// eslint-disable-next-line no-null/no-null
		input: [null, ['2345675643', 'Hello!%']],
		output: 'Parameter encoding error',
	},
];

export const validDecodeParametersData: {
	input: Parameters<typeof decodeParameters>;
	outputResult: any;
}[] = [
	{
		input: [['uint256', 'string'], encodedUintString],
		outputResult: {
			'0': '2345675643',
			'1': 'Hello!%',
			__length__: 2,
		},
	},
	{
		input: [['uint8[]', 'bytes32'], encodedUintArrayBytes32],
		outputResult: {
			'0': ['34', '255'],
			'1': '0x324567fff0000000000000000000000000000000000000000000000000000000',
			__length__: 2,
		},
	},
	{
		input: [
			[
				'uint8[]',
				{
					ParentStruct: {
						propertyOne: 'uint256',
						propertyTwo: 'uint256',
						ChildStruct: {
							propertyOne: 'uint256',
							propertyTwo: 'uint256',
						},
					},
				},
			],
			encodedUintArrayStruct,
		],
		outputResult: {
			'0': ['34', '255'],
			'1': {
				'0': '42',
				'1': '56',
				'2': {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				propertyOne: '42',
				propertyTwo: '56',
				ChildStruct: {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				__length__: 3,
			},
			ParentStruct: {
				'0': '42',
				'1': '56',
				'2': {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				propertyOne: '42',
				propertyTwo: '56',
				ChildStruct: {
					'0': '45',
					'1': '78',
					propertyOne: '45',
					propertyTwo: '78',
					__length__: 2,
				},
				__length__: 3,
			},
			__length__: 2,
		},
	},
	{
		input: [[userTupleAbi], encodedUserTuple],
		outputResult: {
			'0': {
				'0': 'Rick Sanchez',
				'1': addressA,
				'2': {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
				__length__: 3,
				addr: addressA,
				contact: {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
				name: 'Rick Sanchez',
			},
			__length__: 1,
			user: {
				'0': 'Rick Sanchez',
				'1': addressA,
				'2': {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
				__length__: 3,
				addr: addressA,
				contact: {
					'0': 'rick.c137@citadel.cfc',
					'1': '+1 (555) 314-1593',
					__length__: 2,
					email: 'rick.c137@citadel.cfc',
					phone: '+1 (555) 314-1593',
				},
				name: 'Rick Sanchez',
			},
		},
	},
];

export const inValidDecodeParametersData: {
	input: any[];
	output: string;
}[] = [
	{
		input: [['uint8[]', 'bytes32'], '0x000000000010'],
		output: 'Parameter decoding error',
	},
	{
		input: [345, '0x000000000010'],
		output: 'Parameter decoding error',
	},
	{
		input: [true, '0x000000000010'],
		output: 'Parameter decoding error',
	},
	{
		input: [undefined, '0x000000000010'],
		output: 'Parameter decoding error',
	},
	{
		// Using "null" value intentionally for validation
		// eslint-disable-next-line no-null/no-null
		input: [null, '0x000000000010'],
		output: 'Parameter decoding error',
	},
];

export const validDecodeContractErrorData: {
	input: any[];
	output: any;
}[] = [
	{
		input: [
			[
				{ inputs: [], name: 'ErrorWithNoParams', type: 'error' },
				{
					inputs: [
						{ name: 'code', type: 'uint256' },
						{ name: 'message', type: 'string' },
					],
					name: 'ErrorWithParams',
					type: 'error',
				},
			],
			{
				code: 12,
				message: 'message',
				data: encodedErrorWithParams,
			},
		],
		output: {
			errorName: 'ErrorWithParams',
			errorSignature: 'ErrorWithParams(uint256,string)',
			errorArgs: {
				code: 42,
				message: 'This is an error with params',
			},
		},
	},
	{
		input: [
			[
				{ inputs: [], name: 'ErrorWithNoParams', type: 'error' },
				{
					inputs: [
						{ name: 'code', type: 'uint256' },
						{ name: 'message', type: 'string' },
					],
					name: 'ErrorWithParams',
					type: 'error',
				},
			],
			{
				code: 12,
				message: 'message',
				data: {
					code: -32000,
					data: encodedErrorWithParams,
				},
			},
		],
		output: {
			errorName: 'ErrorWithParams',
			errorSignature: 'ErrorWithParams(uint256,string)',
			errorArgs: {
				code: 42,
				message: 'This is an error with params',
			},
			innerError: {
				code: -32000,
			},
		},
	},
	{
		input: [
			[
				{ inputs: [], name: 'ErrorWithNoParams', type: 'error' },
				{
					inputs: [
						{ name: 'code', type: 'uint256' },
						{ name: 'message', type: 'string' },
					],
					name: 'ErrorWithParams',
					type: 'error',
				},
			],
			{
				code: 12,
				message: 'message',
				data: {
					originalError: {
						code: 3,
						data: encodedErrorWithParams,
					},
				},
			},
		],
		output: {
			errorName: 'ErrorWithParams',
			errorSignature: 'ErrorWithParams(uint256,string)',
			errorArgs: {
				code: 42,
				message: 'This is an error with params',
			},
			innerError: {
				code: 3,
			},
		},
	},
];

export const invalidDecodeContractErrorData: {
	input: any[];
}[] = [
	{
		input: [
			[
				{ inputs: [], name: 'ErrorWithNoParams', type: 'error' },
				{
					inputs: [
						{ name: 'code', type: 'uint256' },
						{ name: 'message', type: 'string' },
					],
					name: 'ErrorWithParams',
					type: 'error',
				},
			],
			{
				code: 12,
				message: 'message',
				data: '0xc85bda60000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000123450000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c5468697320697320616e206572726f72207769746820706172616d7300000000',
			},
		],
	},
];

export const validIsAbiConstructorFragment: {
	input: any;
}[] = [
	{
		input: { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
	},
];
export const invalidIsAbiConstructorFragment: {
	input: any;
}[] = [
	{
		input: { inputs: [], stateMutability: 'nonpayable', type: 'function' },
	},
];
