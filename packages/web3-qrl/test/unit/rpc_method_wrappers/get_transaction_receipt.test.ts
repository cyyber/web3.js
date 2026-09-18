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
	TransactionReceipt,
	Web3QRLExecutionAPI,
} from '@theqrl/web3-types';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';

import { getTransactionReceipt } from '../../../src/rpc_method_wrappers';
import { mockRpcResponse, testData } from './fixtures/get_transaction_receipt';
import { transactionReceiptSchema } from '../../../src/schemas';

jest.mock('@theqrl/web3-rpc-methods');

describe('getTransactionReceipt', () => {
	let web3Context: Web3Context<Web3QRLExecutionAPI>;

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
			expect(qrlRpcMethods.getTransactionReceipt).toHaveBeenCalledWith(
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
			(qrlRpcMethods.getTransactionReceipt as jest.Mock).mockResolvedValueOnce(
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

	// gqrl serialises "to" as null on contract creation receipts and contractAddress as
	// null everywhere else; the formatter drops null members, so both surface as undefined.
	it('should not expose "to" on a contract creation receipt', async () => {
		const creationReceipt = { ...mockRpcResponse, to: null };
		(qrlRpcMethods.getTransactionReceipt as jest.Mock).mockResolvedValueOnce(creationReceipt);

		const result = (await getTransactionReceipt(
			web3Context,
			...testData[0][1],
			DEFAULT_RETURN_FORMAT,
		)) as TransactionReceipt;
		expect(result.to).toBeUndefined();
		expect(result.contractAddress).toBe(mockRpcResponse.contractAddress);
	});

	it('should not expose contractAddress on a regular receipt', async () => {
		const callReceipt = { ...mockRpcResponse, contractAddress: null };
		(qrlRpcMethods.getTransactionReceipt as jest.Mock).mockResolvedValueOnce(callReceipt);

		const result = (await getTransactionReceipt(
			web3Context,
			...testData[0][1],
			DEFAULT_RETURN_FORMAT,
		)) as TransactionReceipt;
		expect(result.contractAddress).toBeUndefined();
		expect(result.to).toBe(mockRpcResponse.to);
	});
});
