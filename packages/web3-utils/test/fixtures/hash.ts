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

import { TypedObject, TypedObjectAbbreviated, Bytes, Sha3Input } from '@theqrl/web3-types';
import { hexToBytes } from '../../src/converters';

export const sha3Data: [Bytes, string | undefined][] = [
	['test123', '0xf81b517a242b218999ec8eec0ea6e2ddbef2a367a14e93f4a32a39e260f686ad'],
	[
		'0x265385c7f4132228a0d54eb1a9e7460b91c0cc68:2382:image',
		'0x74e687805c0cfbf0065120987739a5b0ba9b3686a1a778a463bddddcd18cc432',
	],
	['1234', '0x387a8233c96e1fc0ad5e284353276177af2186e7afa85296f106336e376669f7'],
	['helloworld', '0xfa26db7ca85ead399216e7c6316bc50ed24393c3122b582735e7f3b0f91b93f0'],
	[
		new Uint8Array([91, 92, 93, 94]),
		'0xafde16013fa7d7214985cb9219a059e063934a01bdb1dc2254f42cf53da68c89',
	],
];

export const sha3ValidData: [Bytes, string | undefined][] = [
	...sha3Data,
	['', undefined],
	[
		'0x265385c7f4132228a0d54eb1a9e7460b91c0cc68',
		'0xb549c60e309fa734059e547a595c28b5ebada949c16229fbf2192650807694f5',
	],
	['0x80', '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'],
	[
		'0x265385c7f4132228a0d54eb1a9e7460b91c0cc68',
		'0xb549c60e309fa734059e547a595c28b5ebada949c16229fbf2192650807694f5',
	],
	['0x1234', '0x56570de287d73cd1cb6092bb8fdee6173974955fdef345ae579ee9f475ea7432'],
];

export const compareSha3JSValidData: [string, any | undefined][] = [
	['0x80', new Uint8Array(hexToBytes('0x80'))],
	[
		'0x265385c7f4132228a0d54eb1a9e7460b91c0cc68',
		new Uint8Array(hexToBytes('0x265385c7f4132228a0d54eb1a9e7460b91c0cc68')),
	],
	['0x1234', new Uint8Array(hexToBytes('0x1234'))],
];

export const sha3InvalidData: [any, string][] = [
	[1, 'Invalid value given "1". Error: not a valid string.'],
	[BigInt(1010), 'Invalid value given "1010". Error: not a valid string.'],
	[undefined, 'Invalid value given "undefined". Error: not a valid string.'],
];

export const sha3RawValidData: [Bytes, string | undefined][] = [
	...sha3Data,
	['', '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'],
];

export const compareSha3JSRawValidData: [string, string][] = [...compareSha3JSValidData];

export const hyperionSha3Data: [TypedObject[] | TypedObjectAbbreviated[], string | undefined][] = [
	[
		[{ type: 'string', value: '31323334' }],
		'0xf15f8da2ad27e486d632dc37d24912f634398918d6f9913a0a0ff84e388be62b',
	],
	[
		[
			{ type: 'string', value: 'helloworld' },
			{ type: 'string', value: '01' },
		],
		'0xfb0a9d38c4dc568cbd105866540986fabf3c08c1bfb78299ce21aa0e5c0c586b',
	],
	[
		[
			{ type: 'string', value: 'hell' },
			{ type: 'string', value: 'oworld' },
			{ type: 'uint16', value: 0x3031 },
		],
		'0xfb0a9d38c4dc568cbd105866540986fabf3c08c1bfb78299ce21aa0e5c0c586b',
	],
	[
		[{ type: 'uint96', value: '32309054545061485574011236401' }],
		'0xfb0a9d38c4dc568cbd105866540986fabf3c08c1bfb78299ce21aa0e5c0c586b',
	],
	[
		[{ type: 'uint256', value: '234' }],
		'0x61c831beab28d67d1bb40b5ae1a11e2757fa842f031a2d0bc94a7867bc5d26c2',
	],
	[
		[{ t: 'int', v: BigInt('234') }],
		'0x9610fc0b0febb9a261336ba87c74bd15053dcf6fa632f94e946d8c2987eb84ff',
	],
	[
		[{ type: 'uint', value: '234' }],
		'0x9610fc0b0febb9a261336ba87c74bd15053dcf6fa632f94e946d8c2987eb84ff',
	],
	[
		[{ type: 'bytes', value: '0x407D73d8a49eeb85D32Cf465507dd71d507100c1' }],
		'0x4e8ebbefa452077428f93c9520d3edd60594ff452a29ac7d2ccc11d47f3ab95b',
	],
	[
		[
			{ type: 'int16', value: -1 },
			{ type: 'uint48', value: 12 },
		],
		'0x81da7abb5c9c7515f57dab2fc946f01217ab52f3bd8958bc36bd55894451a93c',
	],
	[
		[
			{ type: 'int16', value: -1 },
			{ type: 'uint48', value: '0x0c' },
		],
		'0x81da7abb5c9c7515f57dab2fc946f01217ab52f3bd8958bc36bd55894451a93c',
	],
	[
		[{ type: 'string', value: 'Hello!%' }],
		'0x661136a4267dba9ccdf6bfddb7c00e714de936674c4bdb065a531cf1cb15c7fc',
	],
	[
		[
			{
				type: 'address',
				value: 'Q83cd1122848dd1b2E3AF9ca60a1340e595B2C6d5b3B340AfD625e38EEf9067bc9C28db215702Aa8B3C0243Bb13785a9365A35ee1Fe8e57983b1D47d9fff835a3',
			},
		],
		'0xf5b7a6a98c10864489aa345ddc519146e5344a579efbe7a78cbcc4bd24da3686',
	],
	[
		[{ t: 'bytes32', v: '0x407D73d8a49eeb85D32Cf465507dd71d507100c1' }],
		'0x3c69a194aaf415ba5d6afca734660d0a3d45acdc05d54cd1ca89a8988e7625b4',
	],
	[
		[
			{ t: 'string', v: 'Hello!%' },
			{ t: 'int8', v: -23 },
			{
				t: 'address',
				v: 'Q64667193714B974543f3eF370c44f875588022C996f1Fa61C942E5F1266c920F25a833031DaDa57723F7af72D806C515AeEC1Ef1a744b0de76D8e7BD50007f8D',
			},
		],
		'0x240a4ab7cd81b734fe4ead6304bf3f2f4339da47ca736b934394082fc19f55e9',
	],
	[
		[{ t: 'int256', v: '32309054545061485574011236401' }],
		'0x1594ff29e8161679724999598fb6b993f68549092dddc9f183b04c629aeb9d54',
	],
];

export const hyperionSha3ValidData: [
	TypedObject[] | TypedObjectAbbreviated[],
	string | undefined,
][] = [...hyperionSha3Data, [[{ t: 'string', v: '' }], undefined]];

export const hyperionSha3RawValidData: [
	TypedObject[] | TypedObjectAbbreviated[],
	string | undefined,
][] = [
	...hyperionSha3Data,
	[
		[{ t: 'string', v: '' }],
		'0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
	],
];

export const hyperionSha3InvalidData: [any, string][] = [
	[{ t: 'int8', v: 500 }, 'Invalid value given "500". Error: value is larger than size.'],
	[
		{ t: 'bytes', v: '0x407D73d8a49eeb85D32Cf465507dd71d507100c' },
		'Invalid value given "0x407D73d8a49eeb85D32Cf465507dd71d507100c". Error: can not parse as byte data.',
	],
	[
		{ t: 'bytes8', v: '0x407D73d8a49eeb85D32Cf465507dd71d507100' },
		'Invalid value given "0x407D73d8a49eeb85D32Cf465507dd71d507100". Error: can not parse as byte data.',
	],
];

export const encodePackData: [TypedObject[] | TypedObjectAbbreviated[], any][] = [
	[[{ type: 'string', value: '31323334' }], '0x3331333233333334'],
	[[{ type: 'int[]', value: '01' }], `0x${'0'.repeat(127)}1`],
	[[{ type: 'uint[]', value: '01' }], `0x${'0'.repeat(127)}1`],
	[[{ type: 'int', value: 31323334 }], `0x${'0'.repeat(121)}1ddf4c6`],
	[[{ type: 'string', value: '' }], '0x'],
	[
		[
			{
				type: 'address',
				value: 'Q444BAacb272fd62Bd34b98cD204F4E88ebF3bAa8F4436c84Cdbb77280c12f12FD995122fC3F8B548e0e1D3d6d15B03BB45e0116dc5E303C5608de0A087bD4eea',
			},
		],
		'0x444baacb272fd62bd34b98cd204f4e88ebf3baa8f4436c84cdbb77280c12f12fd995122fc3f8b548e0e1d3d6d15b03bb45e0116dc5e303c5608de0a087bd4eea',
	],
	[[{ type: 'bool', value: true }], '0x01'],
	[[{ type: 'bool', value: false }], '0x00'],
	[[{ value: 'Hello!%', type: 'string' }], '0x48656c6c6f2125'],
	[
		[{ t: 'uint256', v: BigInt('2345676856') }],
		'0x000000000000000000000000000000000000000000000000000000008bd03038',
	],
	[
		[{ type: 'uint256', value: '2342342342342342342345676856' }],
		'0x000000000000000000000000000000000000000007918a48d0493ed3da6ed838',
	],
	[[{ type: 'uint8', value: '56' }], '0x38'],
	[[{ v: '256', t: 'uint16' }], '0x0100'],
	[[{ v: '3256', t: 'uint32' }], '0x00000cb8'],
	[[{ v: '44454256', t: 'uint128' }], '0x00000000000000000000000002a65170'],
	[[{ v: '44454256', t: 'int128' }], '0x00000000000000000000000002a65170'],
	[[{ v: '0x22', t: 'bytes2' }], '0x2200'],
	[[{ v: '0x44222266', t: 'bytes4' }], '0x44222266'],
	[
		[{ v: '0x44555ffffffffdd222222222222224444556553522', t: 'bytes32' }],
		'0x44555ffffffffdd2222222222222244445565535220000000000000000000000',
	],
	[
		[
			{
				v: 'Q83cd1122848dd1b2E3AF9ca60a1340e595B2C6d5b3B340AfD625e38EEf9067bc9C28db215702Aa8B3C0243Bb13785a9365A35ee1Fe8e57983b1D47d9fff835a3',
				t: 'address',
			},
		],
		'0x83cd1122848dd1b2e3af9ca60a1340e595b2c6d5b3b340afd625e38eef9067bc9c28db215702aa8b3c0243bb13785a9365a35ee1fe8e57983b1d47d9fff835a3',
	],
	[
		[{ v: '0x407D73d8a49eeb85D32Cf465507dd71d507100c1', t: 'bytes' }],
		'0x407d73d8a49eeb85d32cf465507dd71d507100c1',
	],
	[[{ t: 'int', v: '0' }], `0x${'0'.repeat(128)}`],
	[
		[{ type: 'int256', value: '1234' }],
		'0x00000000000000000000000000000000000000000000000000000000000004d2',
	],
	[
		[{ type: 'string', value: '1234' }], // should be encoded differently than int256
		'0x31323334',
	],
	[
		[{ type: 'int256', value: 1234 }], // same as type int256 when value is a string
		'0x00000000000000000000000000000000000000000000000000000000000004d2',
	],
	[[{ type: 'int8', value: -128 }], '0x80'],
	[[{ type: 'int8', value: 127 }], '0x7f'],
	[[{ type: 'int512', value: -(BigInt(1) << BigInt(511)) }], `0x8${'0'.repeat(127)}`],
	[[{ type: 'int512', value: (BigInt(1) << BigInt(511)) - BigInt(1) }], `0x7${'f'.repeat(127)}`],
	[
		[{ type: 'uint512', value: (BigInt(1) << BigInt(511)) + BigInt(1) }],
		`0x8${'0'.repeat(126)}1`,
	],
	[
		[{ type: 'int128[]', value: [12345, 324, 1, 2] }],
		'0x00000000000000000000000000003039000000000000000000000000000001440000000000000000000000000000000100000000000000000000000000000002',
	],
	[
		[
			{
				type: 'bytes32[]',
				value: [
					'0x1248',
					'0x3c69a194aaf415ba5d6afca734660d0a3d45acdc05d54cd1ca89a8988e7625b4',
				],
			},
		],
		'0x12480000000000000000000000000000000000000000000000000000000000003c69a194aaf415ba5d6afca734660d0a3d45acdc05d54cd1ca89a8988e7625b4',
	],
	[[{ type: 'bytes4[]', value: ['0x11223344', '0x22334455'] }], '0x1122334422334455'],
];

export const encodePackedInvalidData: [any, string][] = [
	[{ type: 'string', value: 1234 }, 'Invalid value given "1234". Error: not a valid string.'],
	[{ type: 'string', value: true }, 'Invalid value given "true". Error: not a valid string.'],
	[{ type: 'string', value: 1234 }, 'Invalid value given "1234". Error: not a valid string.'],
	[{ type: 'boolean', value: 1234 }, 'Invalid value given "1234". Error: not a valid boolean.'],
	[{ type: 'address', value: 1234 }, 'Invalid value given "1234". Error: invalid qrl address'],
	[{ type: 'address', value: '0x2' }, 'Invalid value given "0x2". Error: invalid qrl address'],
	[{ type: 'uint612', value: 13 }, 'Invalid value given "13". Error: invalid size given.'],
	[
		{ type: 'uint8', value: 1000 },
		'Invalid value given "1000". Error: value is larger than size.',
	],
	[
		{ type: 'uint256', value: -1 },
		'Invalid value given "-1". Error: not a valid unsigned integer.',
	],
	[{ type: 'int255', value: 100 }, 'Invalid value given "int255". Error: invalid size given.'],
	[
		{ type: 'int8', value: -129 },
		'Invalid value given "-129". Error: value is larger than size.',
	],
	[{ type: 'int8', value: 128 }, 'Invalid value given "128". Error: value is larger than size.'],
	[
		{ type: 'int512', value: BigInt(1) << BigInt(511) },
		`Invalid value given "${BigInt(1) << BigInt(511)}". Error: value is larger than size.`,
	],
	[
		{ type: 'int512', value: -(BigInt(1) << BigInt(511)) - BigInt(1) },
		`Invalid value given "${-(BigInt(1) << BigInt(511)) - BigInt(1)}". Error: value is larger than size.`,
	],
	[
		{ type: 'bytes32', value: '0x1' },
		'Invalid value given "0x1". Error: can not parse as byte data.',
	],
];

export const keccak256ValidData: [string | Uint8Array | bigint, string][] = [
	['my data', '0x8e0c48154711500d6fa119cc31df4dec339091e8b426cf4109a769fe89baad31'],
	[
		new Uint8Array(Buffer.from('my data')),
		'0x8e0c48154711500d6fa119cc31df4dec339091e8b426cf4109a769fe89baad31',
	],
	[
		'0x8e0c48154711500d6fa119cc31df4dec339091e8b426cf4109a769fe89baad31',
		'0x2d19cd91fbcc44e6412f92c11da7907cdedb1ace04c47447b42a61f1cd63b85a',
	],
	[BigInt(3), '0x2a80e1ef1d7842f27f2e6be0972bb708b9a135c38860dbe73c27c3486c34f4de'],
];

export const elementaryNameValidData: [any, string][] = [
	['uint128', '128'],
	['int256', '256'],
];

export const hyperionSha3BigIntValidData: [Sha3Input[], string][] = [
	[[3434], '0xdb565a867770a9d66235cca8147e52aa3a49d038da0921f6aaee2cd5acc05147'],
	[[BigInt(3434)], '0xdb565a867770a9d66235cca8147e52aa3a49d038da0921f6aaee2cd5acc05147'],
	[
		[{ t: 'bigint', v: BigInt(3434) }],
		'0xdb565a867770a9d66235cca8147e52aa3a49d038da0921f6aaee2cd5acc05147',
	],

	[[0], '0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5'],
	[[BigInt(0)], '0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5'],
	[
		[{ t: 'bigint', v: BigInt(0) }],
		'0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5',
	],

	[[90071992547409], '0x96e19c53757ecd4ad3f7136622fc7c6cf51a6a5471700a33f5033d3c01fdbaa1'],
	[
		[BigInt(90071992547409)],
		'0x96e19c53757ecd4ad3f7136622fc7c6cf51a6a5471700a33f5033d3c01fdbaa1',
	],
	[
		[{ t: 'bigint', v: BigInt(90071992547409) }],
		'0x96e19c53757ecd4ad3f7136622fc7c6cf51a6a5471700a33f5033d3c01fdbaa1',
	],

	[['0x70696e67', 0], '0x484c78377b276a879fd1ffd74630d990862c4e1d38e621a1f3319e9704cd1e20'],
	[
		['0x70696e67', BigInt(0)],
		'0x484c78377b276a879fd1ffd74630d990862c4e1d38e621a1f3319e9704cd1e20',
	],

	[['0x70696e67', 10], '0x1ef6fe609620640a8c52e6ad0dbbdfc24500e50d5937f0be2d62185da9d19708'],
	[
		['0x70696e67', BigInt(10)],
		'0x1ef6fe609620640a8c52e6ad0dbbdfc24500e50d5937f0be2d62185da9d19708',
	],

	/*
	  //These hash values are generated using contract with function like:
	  
	      function func90071992547409() external pure returns (bytes32) {
        		return keccak256(abi.encodePacked(int(90071992547409))) ;}
	 */
];
