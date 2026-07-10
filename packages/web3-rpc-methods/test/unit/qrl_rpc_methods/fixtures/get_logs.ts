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

import { Filter } from '@theqrl/web3-types';

const validTopic =
	'0xd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72';
const secondValidTopic =
	'0xbe95a82d87a6cb9c7ff4c64e0c15bb1dff20b1d77e6b571b28ad4736f2a2a3e5857e8c225d6d61399b15beef3b196936e490ed6e234374c4887cbbe86c13b1ba';

/**
 * Array consists of:
 * - Test title
 * - Input parameters:
 *     - filter
 */
type TestData = [string, [Filter]];
export const testData: TestData[] = [
	[
		'filter = fromBlock',
		[
			{
				fromBlock: '0xc0ff3',
			},
		],
	],
	[
		'filter = toBlock',
		[
			{
				toBlock: '0xc0ff3',
			},
		],
	],
	[
		'filter = address',
		[
			{
				address:
					'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098afe7a8d28bbc88dcf41f8e06d97c74958a47dc',
			},
		],
	],
	[
		'filter = address[]',
		[
			{
				address: [
					'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098afe7a8d28bbc88dcf41f8e06d97c74958a47dc',
					'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dfd5293d8e347dfe59e90efd55b2956a1343963d',
				],
			},
		],
	],
	[
		'filter = topics[]',
		[
			{
				topics: [
					validTopic,
					// Using "null" value intentionally for validation
					// eslint-disable-next-line no-null/no-null
					null,
					[validTopic, secondValidTopic],
				],
			},
		],
	],
	[
		'filter = fromBlock, toBlock, address[], topics[]',
		[
			{
				fromBlock: '0xc0ff3',
				toBlock: '0xc0ff3',
				address: [
					'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098afe7a8d28bbc88dcf41f8e06d97c74958a47dc',
					'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dfd5293d8e347dfe59e90efd55b2956a1343963d',
				],
				topics: [
					validTopic,
					// Using "null" value intentionally for validation
					// eslint-disable-next-line no-null/no-null
					null,
					[validTopic, secondValidTopic],
				],
			},
		],
	],
];
