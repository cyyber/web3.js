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

import {
	Address,
	Bytes,
	HexString,
	Numbers,
	ValueTypes,
	ZPrefixedHexString,
} from '@theqrl/web3-types';
import { ZondUnits, hexToBytes } from '../../src/converters';

export const bytesToHexValidData: [Bytes, HexString][] = [
	[new Uint8Array([72]), '0x48'],
	[new Uint8Array([72, 12]), '0x480c'],
	[new Uint8Array(hexToBytes('0c12')), '0x0c12'],
	['0x9c12', '0x9c12'],
	['0X12c6', '0x12c6'],
];

export const bytesToHexInvalidData: [any, string][] = [
	[[9.5, 12.9], 'value "[9.5,12.9]" at "/0" must pass "bytes" validation'],
	[[-72, 12], 'value "[-72,12]" at "/0" must pass "bytes" validation'],
	[[567, 10098], 'value "[567,10098]" at "/0" must pass "bytes" validation'],
	[[786, 12, 34, -2, 3], 'value "[786,12,34,-2,3]" at "/0" must pass "bytes" validation'],
	['0x0c1g', 'value "0x0c1g" at "/0" must pass "bytes" validation'],
	['0c1g', 'value "0c1g" at "/0" must pass "bytes" validation'],
	['0x123', 'value "0x123" at "/0" must pass "bytes" validation'],
	['data', 'value "data" at "/0" must pass "bytes" validation'],
	[12, 'value "12" at "/0" must pass "bytes" validation'],
	[['string'], 'value "["string"]" at "/0" must pass "bytes" validation'],
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[null, 'value "null" at "/0" must pass "bytes" validation'],
	[undefined, 'Web3 validator found 1 error[s]:\nvalue at "/0" is required'],
	[{}, 'value "{}" at "/0" must pass "bytes" validation'],
	['1', 'value "1" at "/0" must pass "bytes" validation'],
	['0', 'value "0" at "/0" must pass "bytes" validation'],
];

export const hexToBytesValidData: [HexString, Uint8Array][] = [
	['0x48', new Uint8Array([72])],
	['0x3772', new Uint8Array([55, 114])],
	['0x480c', new Uint8Array([72, 12])],
	['0x0c12', new Uint8Array([12, 18])],
	['0x9c12', new Uint8Array([156, 18])],
	['0X12c6', new Uint8Array([18, 198])],
];

export const hexToBytesInvalidData: [any, string][] = [
	[[9.5, 12.9], 'value "[9.5,12.9]" at "/0" must pass "bytes" validation'],
	[[-72, 12], 'value "[-72,12]" at "/0" must pass "bytes" validation'],
	[[567, 10098], 'value "[567,10098]" at "/0" must pass "bytes" validation'],
	[[786, 12, 34, -2, 3], 'value "[786,12,34,-2,3]" at "/0" must pass "bytes" validation'],
	['0x0c1g', 'value "0x0c1g" at "/0" must pass "bytes" validation'],
	['0c1g', 'value "0x0c1g" at "/0" must pass "bytes" validation'],
	['0x123', 'value "0x123" at "/0" must pass "bytes" validation'],
	['data', 'value "0xdata" at "/0" must pass "bytes" validation'],
	[12, 'value "12" at "/0" must pass "bytes" validation'],
	[['string'], 'value "["string"]" at "/0" must pass "bytes" validation'],
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[null, 'Web3 validator found 1 error[s]:\nvalue "null" at "/0" must pass "bytes" validation'],
	[undefined, 'Web3 validator found 1 error[s]:\nvalue at "/0" is required'],
	[{}, 'value "{}" at "/0" must pass "bytes" validation'],
];

export const numberToHexValidData: [Numbers, HexString][] = [
	[1, '0x1'],
	[255, '0xff'],
	[256, '0x100'],
	[54, '0x36'],
	[BigInt(12), '0xc'],
	['768', '0x300'],
	['-768', '-0x300'],
	[-255, '-0xff'],
	['0xFF0', '0xff0'],
	['-0xa0', '-0xa0'],
	[0xff, '0xff'],
	[-0xff, '-0xff'],
];

export const numberToHexstrictValidData: [Numbers, HexString][] = [
	[1, '0x01'],
	[255, '0xff'],
	[256, '0x0100'],
	[54, '0x36'],
	[BigInt(12), '0x0c'],
	['768', '0x0300'],
	['-768', '-0x0300'],
	[-255, '-0xff'],
	['0xFF0', '0x0ff0'],
	['-0xa0', '-0xa0'],
	[0xff, '0xff'],
	[-0xff, '-0xff'],
];

export const numberToHexInvalidData: [any, string][] = [
	[12.2, 'value "12.2" at "/0" must pass "int" validation'],
	['0xag', 'value "0xag" at "/0" must pass "int" validation'],
	['122g', 'value "122g" at "/0" must pass "int" validation'],
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[null, 'value "null" at "/0" must pass "int" validation'],
	[undefined, 'Web3 validator found 1 error[s]:\nvalue at "/0" is required'],
	[{}, 'value "{}" at "/0" must pass "int" validation'],
];

export const hexToNumberValidData: [HexString, Numbers][] = [
	['0x1', 1],
	['0xff', 255],
	['0x100', 256],
	['0x36', 54],
	['0xc', 12],
	['0x300', 768],
	['-0x300', -768],
	['-0xff', -255],
	['0XFF0', 4080],
	['-0xa0', -160],
	['0x1fffffffffffff', 9007199254740991], // Number.MAX_SAFE_INTEGER
	['0x20000000000000', BigInt('9007199254740992')], // Number.MAX_SAFE_INTEGER + 1
	['-0x1fffffffffffff', -9007199254740991], // Number.MIN_SAFE_INTEGER
	['-0x20000000000000', BigInt('-9007199254740992')], // Number.MIN_SAFE_INTEGER - 1
];

export const hexToNumberInvalidData: [HexString, string][] = [
	['1a', 'value "1a" at "/0" must pass "hex" validation'],
	['0xffdg', 'value "0xffdg" at "/0" must pass "hex" validation'],
	['xfff', 'value "xfff" at "/0" must pass "hex" validation'],
	['-123', 'value "-123" at "/0" must pass "hex" validation'],
	['-9x123', 'value "-9x123" at "/0" must pass "hex" validation'],
];

export const utf8ToHexValidData: [string, HexString][] = [
	['I have 100£', '0x49206861766520313030c2a3'],
	['I \u1234data', '0x4920e188b464617461'],
	['I ♥ data', '0x4920e299a52064617461'],
	['I \u0000 data', '0x4920002064617461'],
	['\u0000 null suffix', '0x206e756c6c20737566666978'],
	['null prefix\u0000', '0x6e756c6c20707265666978'],
	['\u0000', '0x'],
];

export const utf8ToHexInvalidData: [any, string][] = [
	[12, 'value "12" at "/0" must pass "string" validation'],
	[BigInt(12), 'value "12" at "/0" must pass "string" validation'],
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[null, 'value "null" at "/0" must pass "string" validation'],
	[undefined, 'Web3 validator found 1 error[s]:\nvalue at "/0" is required'],
	[{}, 'value "{}" at "/0" must pass "string" validation'],
	[true, 'value "true" at "/0" must pass "string" validation'],
	[false, 'value "false" at "/0" must pass "string" validation'],
];

export const hexToUtf8ValidData: [HexString, string][] = [
	['0x49206861766520313030c2a3', 'I have 100£'],
	['0x4920e188b464617461', 'I \u1234data'],
	['0x4920e299a52064617461', 'I ♥ data'],
	['0x4920002064617461', 'I \u0000 data'],
	['0x206e756c6c20737566666978', ' null suffix'],
	['0x6e756c6c20707265666978', 'null prefix'],
	['4d6172696e', 'Marin'],
];

export const toUtf8ValidData: [string | Uint8Array, string][] = [
	...hexToUtf8ValidData,
	[hexToBytes('0x206e756c6c20737566666978'), ' null suffix'],
	[hexToBytes('0x4920002064617461'), 'I \u0000 data'],
	[hexToBytes('0x49206861766520313030c2a3'), 'I have 100£'],
];

export const hexToUtf8InvalidData: [any, string][] = [
	[
		'0x4920686176652031303g0c2a3',
		'value "0x4920686176652031303g0c2a3" at "/0" must pass "bytes" validation',
	],
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[null, 'value "null" at "/0" must pass "bytes" validation'],
	[undefined, 'Web3 validator found 1 error[s]:\nvalue at "/0" is required'],
	[{}, 'value "{}" at "/0" must pass "bytes" validation'],
	[true, 'value "true" at "/0" must pass "bytes" validation'],
];

export const asciiToHexValidData: [string, HexString][] = [
	['I have 100', '0x49206861766520313030'],
	['I \u0001data', '0x49200164617461'],
	['I data', '0x492064617461'],
	['I \u0000 data', '0x4920002064617461'],
	['\u0000 null suffix', '0x00206e756c6c20737566666978'],
	['null prefix\u0000', '0x6e756c6c2070726566697800'],
	['\u0000', '0x00'],
	['', '0x'],
];

export const hexToAsciiValidData: [string, HexString][] = [
	['0x49206861766520313030', 'I have 100'],
	['0x49203464617461', 'I 4data'],
	['0x492064617461', 'I data'],
	['0x4920002064617461', 'I \u0000 data'],
	['0x00206e756c6c20737566666978', '\u0000 null suffix'],
	['0x6e756c6c2070726566697800', 'null prefix\u0000'],
	['0x00', '\u0000'],
	['0x', ''],
];

export const toHexValidData: [Numbers | Bytes | Address | boolean, [HexString, ValueTypes]][] = [
	[1, ['0x1', 'uint256']],
	[255, ['0xff', 'uint256']],
	[256, ['0x100', 'uint256']],
	[BigInt(12), ['0xc', 'bigint']],
	['768', ['0x373638', 'string']],
	['-768', ['0x2d373638', 'string']],
	[-255, ['-0xff', 'int256']],
	['I have 100£', ['0x49206861766520313030c2a3', 'string']],
	['I \u0000 data', ['0x4920002064617461', 'string']],
	['\u0000 null suffix', ['0x206e756c6c20737566666978', 'string']],
	['null prefix\u0000', ['0x6e756c6c20707265666978', 'string']],
	['\u0000', ['0x', 'string']],
	[true, ['0x01', 'bool']],
	[false, ['0x00', 'bool']],
	['0x123c', ['0x123c', 'bytes']],
	[
		'0x72fdb1c1ddd4c67804f42b93de95cf6a8c51d2d1',
		['0x72fdb1c1ddd4c67804f42b93de95cf6a8c51d2d1', 'bytes'],
	],
	[
		'Q72fdb1c1ddd4c67804f42b93de95cf6a8c51d2d1',
		['0x72fdb1c1ddd4c67804f42b93de95cf6a8c51d2d1', 'address'],
	],
	['-0x01', ['-0x1', 'int256']],
	['123c', ['0x123c', 'bytes']],
];

export const toHexInvalidData: [any, string][] = [
	[undefined, 'Invalid value given "undefined". Error: can not be converted to hex.'],
];

const conversionBaseData: [[Numbers, ZondUnits], string][] = [
	[[0, 'planck'], '0'],
	[[123, 'planck'], '123'],
	[['123', 'planck'], '123'],
	[[BigInt(123), 'planck'], '123'],
	[['1000', 'planck'], '1000'],
	[['1', 'kplanck'], '0.001'],
	[['1', 'mplanck'], '0.000001'],
	[['1', 'gplanck'], '0.000000001'],
	[['1', 'micro'], '0.000000000001'],
	[['1', 'milli'], '0.000000000000001'],
	[['1', 'zond'], '0.000000000000000001'],
	[['1', 'kzond'], '0.000000000000000000001'],
	[['1', 'mzond'], '0.000000000000000000000001'],
	[['1', 'gzond'], '0.000000000000000000000000001'],
	[['1', 'tzond'], '0.000000000000000000000000000001'],
	[['900000000000000000000000000001', 'tzond'], '0.900000000000000000000000000001'],
	[['1000', 'kplanck'], '1'],
	[['1000000', 'mplanck'], '1'],
	[['1000000000', 'gplanck'], '1'],
	[['1000000000000', 'micro'], '1'],
	[['1000000000000000', 'milli'], '1'],
	[['1000000000000000000', 'zond'], '1'],
	[['1000000000000000000000', 'kzond'], '1'],
	[['1000000000000000000000000', 'mzond'], '1'],
	[['1000000000000000000000000000', 'gzond'], '1'],
	[['1000000000000000000000000000000', 'tzond'], '1'],
	[['1000000000000000000000000000000', 'tzond'], '1'],
	[['12345678', 'gplanck'], '0.012345678'],
	[['76912345678', 'gplanck'], '76.912345678'],
	[['134439381738', 'gplanck'], '134.439381738'],
	[['178373938391829348', 'zond'], '0.178373938391829348'],
	[['879123456788877661', 'gplanck'], '879123456.788877661'],
	[['879123456788877661', 'tzond'], '0.000000000000879123456788877661'],
];

export const fromPlanckValidData: [[Numbers, ZondUnits], string][] = [
	...conversionBaseData,
	[['0xff', 'planck'], '255'],
];

export const toPlanckValidData: [[Numbers, ZondUnits], string][] = [
	...conversionBaseData,
	[['255', 'planck'], '0xFF'],
];

export const fromPlanckInvalidData: [[any, any], string][] = [
	// eslint-disable-next-line no-useless-escape
	[['123.34', 'kplanck'], 'Invalid value given "123.34". Error: can not parse as number data.'],
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[[null, 'kplanck'], 'Invalid value given "undefined". Error: can not parse as number data.'],
	[
		[undefined, 'kplanck'],
		'Invalid value given "undefined". Error: can not parse as number data.',
	],
	[[{}, 'kplanck'], 'Invalid value given "{}". Error: can not parse as number data'],
	[['data', 'kplanck'], 'Invalid value given "data". Error: can not parse as number data.'],
	[['1234', 'uplanck'], 'Invalid value given "uplanck". Error: invalid unit.'],
];

export const toPlanckInvalidData: [[any, any], string][] = [
	// Using "null" value intentionally for validation
	// eslint-disable-next-line no-null/no-null
	[[null, 'kplanck'], 'value "null" at "/0" must pass "number" validation'],
	[[undefined, 'kplanck'], 'Web3 validator found 1 error[s]:\nvalue at "/0" is required'],
	[[{}, 'kplanck'], 'value "{}" at "/0" must pass "number" validation'],
	[['data', 'kplanck'], 'value "data" at "/0" must pass "number" validation'],
	[['1234', 'uplanck'], 'Invalid value given "uplanck". Error: invalid unit.'],
];
export const toCheckSumValidData: [string, string][] = [
	['Q0089d53f703f7e0843953d48133f74ce247184c2', 'Q0089d53F703f7E0843953D48133f74cE247184c2'],
	['Q5fbc2b6c19ee3dd5f9af96ff337ddc89e30ceaef', 'Q5FBc2b6C19EE3DD5f9Af96ff337DDC89e30ceAef'],
	['Qa54D3c09E34aC96807c1CC397404bF2B98DC4eFb', 'Qa54d3c09E34aC96807c1CC397404bF2B98DC4eFb'],
];
export const toCheckSumInvalidData: [string, string][] = [
	['not an address', 'Invalid value given "not an address". Error: invalid zond address.'],
];

export const bytesToUint8ArrayInvalidData: [any, string][] = bytesToHexInvalidData;

export const bytesToUint8ArrayValidData: [Bytes, Uint8Array][] = [
	[new Uint8Array([72]), new Uint8Array([72])],
	[new Uint8Array([72, 12]), new Uint8Array([72, 12])],
	['0x9c12', new Uint8Array([156, 18])],
	['0X12c6', new Uint8Array([18, 198])],
	['0X01', new Uint8Array([1])],
	['0X00', new Uint8Array([0])],
	['0x1234', new Uint8Array([18, 52])],
	[new Uint8Array(hexToBytes('0c12')), new Uint8Array(hexToBytes('0c12'))],
];

export const toBigIntValidData: [any, bigint][] = [
	[BigInt(1), BigInt(1)],
	[24, BigInt(24)],
	['123', BigInt(123)],
	['0x04', BigInt(4)],
];

export const toBigIntInvalidData: [any, string][] = [
	[new Uint8Array([]), 'can not parse as number data'],
	['wwwww', ' Error: can not parse as number data'],
	['zzzzee0xiiuu', ' Error: can not parse as number data'],
];

export const addressToBytesValidData: [ZPrefixedHexString, Uint8Array][] = [
	[
		'Q4848484848484848484848484848484848484848',
		new Uint8Array([
			72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
		]),
	],
	[
		'Q3772377237723772377237723772377237723772',
		new Uint8Array([
			55, 114, 55, 114, 55, 114, 55, 114, 55, 114, 55, 114, 55, 114, 55, 114, 55, 114, 55,
			114,
		]),
	],
	[
		'Q480c480c480c480c480c480c480c480c480c480c',
		new Uint8Array([
			72, 12, 72, 12, 72, 12, 72, 12, 72, 12, 72, 12, 72, 12, 72, 12, 72, 12, 72, 12,
		]),
	],
];

export const addressToHexValidData: [ZPrefixedHexString, HexString][] = [
	['Q4848484848484848484848484848484848484848', '0x4848484848484848484848484848484848484848'],
	['Q3772377237723772377237723772377237723772', '0x3772377237723772377237723772377237723772'],
	['Q480c480c480c480c480c480c480c480c480c480c', '0x480c480c480c480c480c480c480c480c480c480c'],
	['Q9c129c129c129c129c129c129c129c129c129c12', '0x9c129c129c129c129c129c129c129c129c129c12'],
	['Q12c612c612c612c612c612c612c612c612c612c6', '0x12c612c612c612c612c612c612c612c612c612c6'],
];

export const invalidAddressData: [any, string][] = [
	['Z1', 'value "Z1" at "/0" must pass "address" validation'],
	[
		'QE247a45c287191d435A8a5D72A7C8dc030451E9F',
		'value "QE247a45c287191d435A8a5D72A7C8dc030451E9F" at "/0" must pass "address" validation',
	], // Invalid checksum
	[
		'-Q407d73d8a49eeb85d32cf465507dd71d507100c1',
		'value "-Q407d73d8a49eeb85d32cf465507dd71d507100c1" at "/0" must pass "address" validation',
	],
];

export const hexToAddressValidData: [HexString, ZPrefixedHexString][] = [
	['0x4848484848484848484848484848484848484848', 'Q4848484848484848484848484848484848484848'],
	['0x3772377237723772377237723772377237723772', 'Q3772377237723772377237723772377237723772'],
	['0x480c480c480c480c480c480c480c480c480c480c', 'Q480c480c480c480c480c480c480c480c480c480c'],
	['0x9c129c129c129c129c129c129c129c129c129c12', 'Q9c129c129c129c129c129c129c129c129c129c12'],
	['0x12c612c612c612c612c612c612c612c612c612c6', 'Q12c612c612c612c612c612c612c612c612c612c6'],
];

export const hexToAddressInvalidData: [HexString, string][] = [
	['1a', 'value "1a" at "/0" must pass "hex" validation'],
	['0xffdg', 'value "0xffdg" at "/0" must pass "hex" validation'],
	['xfff', 'value "xfff" at "/0" must pass "hex" validation'],
	['-123', 'value "-123" at "/0" must pass "hex" validation'],
	['-9x123', 'value "-9x123" at "/0" must pass "hex" validation'],
];
