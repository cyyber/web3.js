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
import { Eip712TypedData } from '@theqrl/web3-types';

/**
 * string is the test title
 * Eip712TypedData is the entire EIP-712 typed data object
 * boolean is whether the EIP-712 encoded data is keccak256 hashed
 * string is the encoded data expected to be returned by getEncodedEip712Data
 */
export const testData: [string, Eip712TypedData, boolean | undefined, string][] = [
	[
		'should get encoded message without hashing, hash = undefined',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				Person: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'wallet',
						type: 'address',
					},
				],
				Mail: [
					{
						name: 'from',
						type: 'Person',
					},
					{
						name: 'to',
						type: 'Person',
					},
					{
						name: 'contents',
						type: 'string',
					},
				],
			},
			primaryType: 'Mail',
			domain: {
				name: 'Ether Mail',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				from: {
					name: 'Cow',
					wallet: 'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
				},
				to: {
					name: 'Bob',
					wallet: 'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				},
				contents: 'Hello, Bob!',
			},
		},
		undefined,
		'0x190149835345d86e6cd42cf128c9356b5e3d4113de47146857b604acdb65a3a14efcf74d278ada62d6a9af2e969813f67b02a0959443b427f4f3f2d7a1d3a8b7b9bc',
	],
	[
		'should get encoded message without hashing, hash = false',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				Person: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'wallet',
						type: 'address',
					},
				],
				Mail: [
					{
						name: 'from',
						type: 'Person',
					},
					{
						name: 'to',
						type: 'Person',
					},
					{
						name: 'contents',
						type: 'string',
					},
				],
			},
			primaryType: 'Mail',
			domain: {
				name: 'Ether Mail',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				from: {
					name: 'Cow',
					wallet: 'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
				},
				to: {
					name: 'Bob',
					wallet: 'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				},
				contents: 'Hello, Bob!',
			},
		},
		false,
		'0x190149835345d86e6cd42cf128c9356b5e3d4113de47146857b604acdb65a3a14efcf74d278ada62d6a9af2e969813f67b02a0959443b427f4f3f2d7a1d3a8b7b9bc',
	],
	[
		'should get the hashed encoded message, hash = true',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				Person: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'wallet',
						type: 'address',
					},
				],
				Mail: [
					{
						name: 'from',
						type: 'Person',
					},
					{
						name: 'to',
						type: 'Person',
					},
					{
						name: 'contents',
						type: 'string',
					},
				],
			},
			primaryType: 'Mail',
			domain: {
				name: 'Ether Mail',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				from: {
					name: 'Cow',
					wallet: 'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
				},
				to: {
					name: 'Bob',
					wallet: 'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				},
				contents: 'Hello, Bob!',
			},
		},
		true,
		'0xf6689a60d41acc93fc2a6d2cef8150d776b62c866c4ba04c7ea0a9ddfbd67c5e',
	],
	[
		'should get encoded message with array types',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: [
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
					'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
					'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				],
				array3: [123456, 654321, 42],
			},
		},
		false,
		'0x1901320806f46659dcfc93ffbb8d7ef545c5a1ed4d66ba6525d8df60ca58f6beef9b5c59b9659cf7843220e18df18a71d1599af1dc6461808d18d15c29381fc69a73',
	],
	[
		'should get encoded message with array types',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: [
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
					'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
					'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				],
				array3: [123456, 654321, 42],
			},
		},
		true,
		'0x2bd2a56943f8c40d73a934bfda4d2dc90de3b5610fda9c47238ca97a086b2d3d',
	],
	[
		'should get encoded message with fixed array',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[3]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: [
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
					'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
					'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				],
				array3: [123456, 654321, 42],
			},
		},
		false,
		'0x1901320806f46659dcfc93ffbb8d7ef545c5a1ed4d66ba6525d8df60ca58f6beef9b2267fb8b769f7129d648a9fb181be878bdd68d5754525cda887c81984317ae2a',
	],
	[
		'should get encoded message with fixed array',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[3]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: [
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
					'Q5bBAb228de3fAfa50Fd6cCefAA75d5da361a8a2A82F75CC29B257669F6EeCc4ec9303597D0b9b6C2B4eF70EFdCeE40209Ac5e440969cD005CB40F7739a96C1cD',
					'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				],
				array3: [123456, 654321, 42],
			},
		},
		true,
		'0xf64637c2955c54752cceb7ee192698937ea81f80d066fdc24064155d2d881875',
	],
	[
		'should get encoded message with bytes32',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'bytes32',
						type: 'bytes32',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				bytes32: '0x133d00e67f2390ce846a631aeb6718a674a3923f5320b79b6d3e2f5bf146319e',
			},
		},
		false,
		'0x1901320806f46659dcfc93ffbb8d7ef545c5a1ed4d66ba6525d8df60ca58f6beef9bbc5be4b6d5ef8cde54a896425544471fbba4990dee3749713466ec82f1a412dc',
	],
	[
		'should get encoded message with bytes32',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'bytes32',
						type: 'bytes',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				bytes32: '0x133d00e67f2390ce846a631aeb6718a674a3923f5320b79b6d3e2f5bf146319e',
			},
		},
		false,
		'0x1901320806f46659dcfc93ffbb8d7ef545c5a1ed4d66ba6525d8df60ca58f6beef9b5823e155044288a8c7aeea2e0c77e8469c23cf6b13fd48c98da0d4bd6561221c',
	],
	[
		'should get encoded message with bytes32',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'bytes32',
						type: 'bytes32',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				bytes32: '0x133d00e67f2390ce846a631aeb6718a674a3923f5320b79b6d3e2f5bf146319e',
			},
		},
		true,
		'0x282e6c14e332ff229969156889eee91baab48df55e30284831a3dee4e288d2f6',
	],
];

/**
 * string is the test title
 * Eip712TypedData is the entire EIP-712 typed data object
 * boolean is whether the EIP-712 encoded data is keccak256 hashed
 * string is the encoded data expected to be returned by getEncodedEip712Data
 */
export const erroneousTestData: [string, Eip712TypedData, boolean | undefined, Error][] = [
	[
		'should throw error: Cannot encode data: value is not of array type',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: 'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				array3: [123456, 654321, 42],
			},
		},
		false,
		new Error('Cannot encode data: value is not of array type'),
	],
	[
		'should throw error: Cannot encode data: expected length of 3, but got 1',
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[3]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: [
					'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				],
				array3: [123456, 654321, 42],
			},
		},
		false,
		new Error('Cannot encode data: expected length of 3, but got 1'),
	],
	[
		"should throw error: Cannot encode data: missing data for 'array3'",
		{
			types: {
				EIP712Domain: [
					{
						name: 'name',
						type: 'string',
					},
					{
						name: 'version',
						type: 'string',
					},
					{
						name: 'chainId',
						type: 'uint256',
					},
					{
						name: 'verifyingContract',
						type: 'address',
					},
				],
				ArrayData: [
					{
						name: 'array1',
						type: 'string[]',
					},
					{
						name: 'array2',
						type: 'address[]',
					},
					{
						name: 'array3',
						type: 'uint256[]',
					},
				],
			},
			primaryType: 'ArrayData',
			domain: {
				name: 'Array Data',
				version: '1',
				chainId: 1,
				verifyingContract:
					'Qf66D63eB29f937925bAB98a28d5AC0effBC421Ca2fd96dE918352648ca79f678faebaCB5209D52949AAf01F849AA087A42995c1c6996C3a5504960Eb88943556',
			},
			message: {
				array1: ['string', 'string2', 'string3'],
				array2: [
					'Q2d09d65e6aC14659798fA27AC2aee81eC03a4Bde0aF4FdeeAee42ABc1fF2BDBDc32EaD5509D9E8426Cb1C6C48942557717d85EFf4AE7aB148f56FcAB0164B324',
				],
				array3: undefined,
			},
		},
		false,
		new Error("Cannot encode data: missing data for 'array3'"),
	],
];
