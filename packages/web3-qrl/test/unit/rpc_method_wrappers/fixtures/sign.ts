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
import { Address, Bytes, FMT_BYTES, FMT_NUMBER } from '@theqrl/web3-types';
import { addressToBytes } from '@theqrl/web3-utils';

export const mockRpcResponse = '0x736f796c656e7420677265656e2069732070656f706c65';

const address = 'Q83cd1122848dd1b2E3AF9ca60a1340e595B2C6d5b3B340AfD625e38EEf9067bc9C28db215702Aa8B3C0243Bb13785a9365A35ee1Fe8e57983b1D47d9fff835a3';

/**
 * Array consists of:
 * - Test title
 * - Input parameters:
 *     - message
 *     - address
 */
type TestData = [string, [Bytes, Address]];
export const testData: TestData[] = [
	[
		'message = "Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c"',
		['Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c', address],
	],
	[
		'message = addressToBytes("Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c")',
		[addressToBytes('Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c'), address],
	],
	[
		'message = addressToBytes("Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c")',
		[
			new Uint8Array([
				99, 42, 182, 208, 46, 5, 26, 82, 25, 11, 107, 228, 11, 83, 92, 124, 20, 206, 249,
				41, 136, 230, 159, 114, 231, 130, 37, 25, 44, 120, 60, 116, 25, 198, 84, 175, 84,
				110, 178, 175, 67, 98, 191, 34, 94, 162, 240, 230, 180, 10, 186, 110, 92, 122,
				174, 81, 142, 27, 156, 171, 61, 223, 64, 140,
			]),
			address,
		],
	],
];
export const walletTestData: [string, [Bytes, Address | number], any][] = [
	[
		'message = "Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c"',
		['Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c', 0],
		{ number: FMT_NUMBER.STR, bytes: FMT_BYTES.UINT8ARRAY },
	],
	[
		'message = "Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c"',
		['Q632AB6D02e051a52190B6be40B535C7C14ceF92988e69F72e78225192C783C7419c654AF546EB2Af4362Bf225eA2F0e6b40abA6E5C7AAe518E1B9cab3DDF408c', 0],
		{ number: FMT_NUMBER.STR, bytes: FMT_BYTES.HEX },
	],
];
