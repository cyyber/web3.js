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
	DEFAULT_RETURN_FORMAT,
	FMT_BYTES,
	FMT_NUMBER,
	Web3ZondExecutionAPI,
} from '@theqrl/web3-types';
import { zondRpcMethods } from '@theqrl/web3-rpc-methods';

import { getTransactionReceipt } from '../../../src/rpc_method_wrappers';
import { mockRpcResponse, testData } from './fixtures/get_transaction_receipt';
import { transactionReceiptSchema } from '../../../src/schemas';

jest.mock('@theqrl/web3-rpc-methods');

describe('getTransactionReceipt', () => {
	let web3Context: Web3Context<Web3ZondExecutionAPI>;

	beforeAll(() => {
		web3Context = new Web3Context('http://127.0.0.1:8545');
	});

	it.each(testData)(
		`should call rpcMethods.getTransaction with expected parameters\nTitle: %s\nInput parameters: %s\n`,
		async (_, inputParameters) => {
			const [inputTransactionHash] = inputParameters;
			const inputTransactionHashFormatted = format(
				{ format: 'bytes32' },
				inputTransactionHash,
				DEFAULT_RETURN_FORMAT,
			);

			await getTransactionReceipt(web3Context, ...inputParameters, DEFAULT_RETURN_FORMAT);
			expect(zondRpcMethods.getTransactionReceipt).toHaveBeenCalledWith(
				web3Context.requestManager,
				inputTransactionHashFormatted,
			);
		},
	);

	it.each(testData)(
		`should format mockRpcResponse using provided return format\nTitle: %s\nInput parameters: %s\n`,
		async (_, inputParameters) => {
			const expectedReturnFormat = { number: FMT_NUMBER.STR, bytes: FMT_BYTES.UINT8ARRAY };
			const expectedFormattedResult = format(
				transactionReceiptSchema,
				mockRpcResponse,
				expectedReturnFormat,
			);
			(zondRpcMethods.getTransactionReceipt as jest.Mock).mockResolvedValueOnce(
				mockRpcResponse,
			);

			const result = await getTransactionReceipt(
				web3Context,
				...inputParameters,
				expectedReturnFormat,
			);
			expect(result).toStrictEqual(expectedFormattedResult);
		},
	);
});
