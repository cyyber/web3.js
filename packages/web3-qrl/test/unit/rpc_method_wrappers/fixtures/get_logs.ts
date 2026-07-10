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
import { FilterResultsAPI, Filter } from '@theqrl/web3-types';

const validTopic =
	'0xd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72';
const secondValidTopic =
	'0xbe95a82d87a6cb9c7ff4c64e0c15bb1dff20b1d77e6b571b28ad4736f2a2a3e5857e8c225d6d61399b15beef3b196936e490ed6e234374c4887cbbe86c13b1ba';

export const mockRpcResponse: FilterResultsAPI = [
	{
		logIndex: '0x1',
		blockNumber: '0x1b4',
		blockHash: '0x8216c5785ac562ff41e2dcfdf5785ac562ff41e2dcfdf829c5a142f1fccd7d',
		transactionHash: '0xdf829c5a142f1fccd7d8216c5785ac562ff41e2dcfdf5785ac562ff41e2dcf',
		transactionIndex: '0x0',
		address:
			'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016c5785ac562ff41e2dcfdf829c5a142f1fccd7d',
		data: '0x0000000000000000000000000000000000000000000000000000000000000000',
		topics: [validTopic],
	},
];

const filter: Filter = {
	address:
		'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000407d73d8a49eeb85d32cf465507dd71d507100c1',
	topics: [
		validTopic,
		// Using "null" value intentionally for validation
		// eslint-disable-next-line no-null/no-null
		null,
		[validTopic, secondValidTopic],
	],
};

/**
 * Array consists of:
 * - Test title
 * - Input parameters:
 *     - filter
 */
type TestData = [string, [Filter]];
export const testData: TestData[] = [[JSON.stringify(filter), [filter]]];
