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
import { Web3Context } from '@theqrl/web3-core';
import { format } from '@theqrl/web3-utils';
import {
	ZOND_DATA_FORMAT,
	DEFAULT_RETURN_FORMAT,
	FMT_NUMBER,
	FMT_BYTES,
	Web3ZondExecutionAPI,
} from '@theqrl/web3-types';
import { isNullish } from '@theqrl/web3-validator';
import { zondRpcMethods } from '@theqrl/web3-rpc-methods';

import { getTransactionCount } from '../../../src/rpc_method_wrappers';
import { mockRpcResponse, testData } from './fixtures/get_transaction_count';

jest.mock('@theqrl/web3-rpc-methods');

describe('getTransactionCount', () => {
	let web3Context: Web3Context<Web3ZondExecutionAPI>;

	beforeAll(() => {
		web3Context = new Web3Context('http://127.0.0.1:8545');
	});

	it.each(testData)(
		`should call rpcMethods.getBalance with expected parameters\nTitle: %s\nInput parameters: %s\n`,
		async (_, inputParameters) => {
			const [inputAddress, inputBlockNumber] = inputParameters;

			let inputBlockNumberFormatted;

			if (isNullish(inputBlockNumber)) {
				inputBlockNumberFormatted = web3Context.defaultBlock;
			} else {
				inputBlockNumberFormatted = format(
					{ format: 'uint' },
					inputBlockNumber,
					ZOND_DATA_FORMAT,
				);
			}

			await getTransactionCount(web3Context, ...inputParameters, DEFAULT_RETURN_FORMAT);
			expect(zondRpcMethods.getTransactionCount).toHaveBeenCalledWith(
				web3Context.requestManager,
				inputAddress,
				inputBlockNumberFormatted,
			);
		},
	);

	it.each(testData)(
		`should format mockRpcResponse using provided return format\nTitle: %s\nInput parameters: %s\n`,
		async (_, inputParameters) => {
			const expectedReturnFormat = { number: FMT_NUMBER.STR, bytes: FMT_BYTES.UINT8ARRAY };
			const expectedFormattedResult = format(
				{ format: 'uint' },
				mockRpcResponse,
				expectedReturnFormat,
			);
			(zondRpcMethods.getTransactionCount as jest.Mock).mockResolvedValueOnce(
				mockRpcResponse,
			);

			const result = await getTransactionCount(
				web3Context,
				...inputParameters,
				expectedReturnFormat,
			);
			expect(result).toBe(expectedFormattedResult);
		},
	);
});
