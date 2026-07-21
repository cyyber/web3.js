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
import { DEFAULT_RETURN_FORMAT, Web3QRLExecutionAPI } from '@theqrl/web3-types';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';
import * as rpcMethodWrappers from '../../../src/rpc_method_wrappers';
import * as WaitForTransactionReceipt from '../../../src/utils/wait_for_transaction_receipt';

import * as WatchTransactionByPolling from '../../../src/utils/watch_transaction_by_pooling';
import {
	expectedTransactionReceipt,
	expectedTransactionHash,
	testData,
} from '../rpc_method_wrappers/fixtures/send_signed_transaction';
import { transactionReceiptSchema } from '../../../src/schemas';
import { sleep } from '../../shared_fixtures/utils';

jest.mock('@theqrl/web3-rpc-methods');
jest.mock('../../../src/utils/wait_for_transaction_receipt');

const mockBlockData = {
	hash: '0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
};

const testMessage =
	'Title: %s\ninputSignedTransaction: %s\nexpectedTransactionHash: %s\nexpectedTransactionReceipt: %s\n';
describe('watchTransactionByPolling', () => {
	describe('should call getBlockByNumber', () => {
		let web3Context: Web3Context<Web3QRLExecutionAPI>;

		beforeAll(() => {
			web3Context = new Web3Context(
				// dummy provider that does not supports subscription
				{
					request: jest.fn(),
				},
			);

			jest.spyOn(qrlRpcMethods, 'getBlockByNumber').mockResolvedValue(mockBlockData as any);
		});

		it.each(testData)(
			`watchTransactionByPolling logic\n ${testMessage}`,
			async (_, inputTransaction) => {
				const formattedTransactionReceipt = format(
					transactionReceiptSchema,
					expectedTransactionReceipt,
					DEFAULT_RETURN_FORMAT,
				);

				(
					WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock
				).mockResolvedValueOnce(expectedTransactionReceipt);

				(qrlRpcMethods.sendRawTransaction as jest.Mock).mockResolvedValueOnce(
					expectedTransactionHash,
				);

				const promiEvent = rpcMethodWrappers.sendSignedTransaction(
					web3Context,
					inputTransaction,
					DEFAULT_RETURN_FORMAT,
				);
				await promiEvent;
				WatchTransactionByPolling.watchTransactionByPolling({
					web3Context,
					transactionReceipt: formattedTransactionReceipt,
					transactionPromiEvent: promiEvent,
					returnFormat: DEFAULT_RETURN_FORMAT,
				});

				await sleep(1000);
				expect(qrlRpcMethods.getBlockByNumber).toHaveBeenCalled();

				// to clear the interval inside the polling function:
				web3Context.transactionConfirmationBlocks = 0;
			},
		);
	});

	describe('when a block fetch fails during polling', () => {
		let web3Context: Web3Context<Web3QRLExecutionAPI>;

		beforeEach(() => {
			web3Context = new Web3Context(
				// dummy provider that does not supports subscription
				{
					request: jest.fn(),
				},
			);
			// keep the poller ticking quickly
			web3Context.transactionReceiptPollingInterval = 50;
			web3Context.transactionPollingInterval = 50;
			// high enough that the "confirmations complete" branch never clears the interval,
			// so the only way the interval stops is via the error handling under test
			web3Context.transactionConfirmationBlocks = 24;
		});

		it('stops the poller (clears the interval) and surfaces the error instead of looping forever', async () => {
			const pollingError = new Error('polling failure');
			(qrlRpcMethods.getBlockByNumber as jest.Mock).mockRejectedValue(pollingError);

			const formattedTransactionReceipt = format(
				transactionReceiptSchema,
				expectedTransactionReceipt,
				DEFAULT_RETURN_FORMAT,
			);

			const emit = jest.fn();
			// minimal stand-in for the Web3PromiEvent; we only observe the emitted error here
			const transactionPromiEvent = { emit } as any;

			WatchTransactionByPolling.watchTransactionByPolling({
				web3Context,
				transactionReceipt: formattedTransactionReceipt,
				transactionPromiEvent,
				returnFormat: DEFAULT_RETURN_FORMAT,
			});

			// allow at least one interval tick (and its rejection) to be processed
			await sleep(300);
			const callsAfterFirstWait = (qrlRpcMethods.getBlockByNumber as jest.Mock).mock.calls
				.length;

			// the failure must have been surfaced via the promiEvent ...
			expect(emit).toHaveBeenCalledWith('error', pollingError);
			expect(callsAfterFirstWait).toBeGreaterThanOrEqual(1);

			// ... and the poller must have stopped: no further polling calls happen
			await sleep(300);
			const callsAfterSecondWait = (qrlRpcMethods.getBlockByNumber as jest.Mock).mock.calls
				.length;
			expect(callsAfterSecondWait).toBe(callsAfterFirstWait);
		});
	});
});
