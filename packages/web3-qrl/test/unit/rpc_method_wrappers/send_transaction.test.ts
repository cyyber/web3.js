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
import { DEFAULT_RETURN_FORMAT, QRL_DATA_FORMAT, Web3QRLExecutionAPI } from '@theqrl/web3-types';
import { isNullish } from '@theqrl/web3-validator';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';
import { ContractExecutionError, InvalidResponseError } from '@theqrl/web3-errors';

import { sendTransaction } from '../../../src/rpc_method_wrappers';
import { formatTransaction } from '../../../src';
import * as GetTransactionGasPricing from '../../../src/utils/get_transaction_gas_pricing';
import * as GetTransactionError from '../../../src/utils/get_transaction_error';
import * as WaitForTransactionReceipt from '../../../src/utils/wait_for_transaction_receipt';
import * as WatchTransactionForConfirmations from '../../../src/utils/watch_transaction_for_confirmations';
import {
	expectedTransactionReceipt,
	expectedTransactionHash,
	testData,
} from './fixtures/send_transaction';
import { transactionReceiptSchema } from '../../../src/schemas';

jest.mock('@theqrl/web3-rpc-methods');
jest.mock('../../../src/utils/wait_for_transaction_receipt');
jest.mock('../../../src/utils/watch_transaction_for_confirmations');

describe('sendTransaction', () => {
	const testMessage =
		'Title: %s\ninputTransaction: %s\nsendTransactionOptions: %s\nexpectedTransactionHash: %s\nexpectedTransactionReceipt: %s\n';

	let web3Context: Web3Context<Web3QRLExecutionAPI>;

	beforeAll(() => {
		web3Context = new Web3Context('http://127.0.0.1:8545');
	});

	afterEach(() => jest.resetAllMocks());

	it.each(testData)(
		`getTransactionGasPricing is called only when expected\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const getTransactionGasPricingSpy = jest.spyOn(
				GetTransactionGasPricing,
				'getTransactionGasPricing',
			);
			(WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock).mockResolvedValue(
				expectedTransactionReceipt,
			);
			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			);

			if (
				sendTransactionOptions?.ignoreGasPricing ||
				(!isNullish(inputTransaction.maxPriorityFeePerGas) &&
					!isNullish(inputTransaction.maxFeePerGas))
			)
				// eslint-disable-next-line jest/no-conditional-expect
				expect(getTransactionGasPricingSpy).not.toHaveBeenCalled();
			// eslint-disable-next-line jest/no-conditional-expect
			else expect(getTransactionGasPricingSpy).toHaveBeenCalled();
		},
	);

	it.each(testData)(
		`sending event should emit with formattedTransaction\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const formattedTransaction = formatTransaction(inputTransaction, QRL_DATA_FORMAT);
			(WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock).mockResolvedValue(
				expectedTransactionReceipt,
			);
			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			).on('sending', transaction => {
				expect(transaction).toStrictEqual(formattedTransaction);
			});

			expect.assertions(1);
		},
	);

	it.each(testData)(
		`should call qrlRpcMethods.sendTransaction with expected parameters\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const formattedTransaction = formatTransaction(inputTransaction, QRL_DATA_FORMAT);
			(WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock).mockResolvedValue(
				expectedTransactionReceipt,
			);
			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			);
			expect(qrlRpcMethods.sendTransaction).toHaveBeenCalledWith(
				web3Context.requestManager,
				formattedTransaction,
			);
		},
	);

	it.each(testData)(
		`sent event should emit with formattedTransaction\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const formattedTransaction = formatTransaction(inputTransaction, QRL_DATA_FORMAT);
			(WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock).mockResolvedValue(
				expectedTransactionReceipt,
			);

			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			).on('sent', transaction => {
				expect(transaction).toStrictEqual(formattedTransaction);
			});

			expect.assertions(1);
		},
	);

	it.each(testData)(
		`transactionHash event should emit with expectedTransactionHash\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			(qrlRpcMethods.sendTransaction as jest.Mock).mockResolvedValueOnce(
				expectedTransactionHash,
			);
			(WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock).mockResolvedValue(
				expectedTransactionReceipt,
			);

			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			).on('transactionHash', transactionHash => {
				expect(transactionHash).toStrictEqual(expectedTransactionHash);
			});

			expect.assertions(1);
		},
	);

	it.each(testData)(
		`should call WaitForTransactionReceipt.waitForTransactionReceipt with expected parameters\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			(qrlRpcMethods.sendTransaction as jest.Mock).mockResolvedValueOnce(
				expectedTransactionHash,
			);
			(WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock).mockResolvedValue(
				expectedTransactionReceipt,
			);

			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			);
			expect(WaitForTransactionReceipt.waitForTransactionReceipt).toHaveBeenCalledWith(
				web3Context,
				expectedTransactionHash,
				DEFAULT_RETURN_FORMAT,
			);
		},
	);

	it.each(testData)(
		`waitForTransactionReceipt is called when expected\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const waitForTransactionReceiptSpy = jest
				.spyOn(WaitForTransactionReceipt, 'waitForTransactionReceipt')
				.mockResolvedValueOnce(expectedTransactionReceipt);

			(qrlRpcMethods.sendTransaction as jest.Mock).mockResolvedValueOnce(
				expectedTransactionHash,
			);

			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			);

			expect(waitForTransactionReceiptSpy).toHaveBeenCalledWith(
				web3Context,
				expectedTransactionHash,
				DEFAULT_RETURN_FORMAT,
			);
		},
	);

	it.each(testData)(
		`receipt event should emit with expectedTransactionReceipt\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const formattedTransactionReceipt = format(
				transactionReceiptSchema,
				expectedTransactionReceipt,
				DEFAULT_RETURN_FORMAT,
			);
			(
				WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock
			).mockResolvedValueOnce(formattedTransactionReceipt);

			await sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			).on('receipt', receiptInfo => {
				expect(receiptInfo).toStrictEqual(formattedTransactionReceipt);
			});

			expect.assertions(1);
		},
	);

	it.each(testData)(
		`should resolve Web3PromiEvent with expectedTransactionReceipt\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const formattedTransactionReceipt = format(
				transactionReceiptSchema,
				expectedTransactionReceipt,
				DEFAULT_RETURN_FORMAT,
			);
			(
				WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock
			).mockResolvedValueOnce(formattedTransactionReceipt);
			expect(
				await sendTransaction(
					web3Context,
					inputTransaction,
					DEFAULT_RETURN_FORMAT,
					sendTransactionOptions,
				),
			).toStrictEqual(formattedTransactionReceipt);
		},
	);

	it.each(testData)(
		`watchTransactionForConfirmations is called when expected\n ${testMessage}`,
		async (_, inputTransaction, sendTransactionOptions) => {
			const watchTransactionForConfirmationsSpy = jest.spyOn(
				WatchTransactionForConfirmations,
				'watchTransactionForConfirmations',
			);
			const formattedTransactionReceipt = format(
				transactionReceiptSchema,
				expectedTransactionReceipt,
				DEFAULT_RETURN_FORMAT,
			);

			(qrlRpcMethods.sendTransaction as jest.Mock).mockResolvedValueOnce(
				expectedTransactionHash,
			);
			(
				WaitForTransactionReceipt.waitForTransactionReceipt as jest.Mock
			).mockResolvedValueOnce(expectedTransactionReceipt);

			const promiEvent = sendTransaction(
				web3Context,
				inputTransaction,
				DEFAULT_RETURN_FORMAT,
				sendTransactionOptions,
			).on('confirmation', () => undefined);

			await promiEvent;

			expect(WaitForTransactionReceipt.waitForTransactionReceipt).toHaveBeenCalledWith(
				web3Context,
				expectedTransactionHash,
				DEFAULT_RETURN_FORMAT,
			);
			expect(watchTransactionForConfirmationsSpy).toHaveBeenCalledWith(
				web3Context,
				promiEvent,
				formattedTransactionReceipt,
				expectedTransactionHash,
				DEFAULT_RETURN_FORMAT,
			);
		},
	);

	// Regression harness for audit finding C2: pre-flight work (formatting, gas
	// pricing) used to run outside the executor's try/catch, so a gas pricing
	// failure produced an unhandled rejection and a PromiEvent that never settled.
	describe('pre-flight failures (audit finding C2)', () => {
		// A transaction with no gas pricing, so getTransactionGasPricing is reached.
		const gasPricelessTransaction = {
			from: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cfec0cbee560cbd6ed89580204af71448f1fb8c5',
			to: 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f02c1c8e6114b1dbe8937a39260b5b0a374432bb',
			gas: '0xc350',
			nonce: '0x15',
			value: '0xf3dbb76162000',
			type: '0x2',
			chainId: '0x1',
		};
		const sendOptions = { checkRevertBeforeSending: false };

		const NOT_SETTLED = Symbol('NOT_SETTLED');

		// Races the PromiEvent against a bounded sentinel, so "never settles" fails
		// the assertion rather than silently blocking until the jest timeout.
		const settleWithin = async (start: () => Promise<unknown>, ms = 250) => {
			let timer: ReturnType<typeof setTimeout> | undefined;
			try {
				return await Promise.race([
					start().then(
						value => ({ status: 'fulfilled' as const, value, reason: undefined }),
						(reason: unknown) => ({
							status: 'rejected' as const,
							value: undefined,
							reason,
						}),
					),
					new Promise<typeof NOT_SETTLED>(resolve => {
						timer = setTimeout(() => resolve(NOT_SETTLED), ms);
					}),
				]);
			} finally {
				if (timer !== undefined) clearTimeout(timer);
			}
		};

		const countErrorEmits = (emitSpy: jest.SpyInstance) =>
			emitSpy.mock.calls.filter(call => call[0] === 'error').length;

		// Lets any would-be unhandled rejection reach the process handler.
		const flushMacrotasks = async () => {
			for (let i = 0; i < 3; i += 1) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise(resolve => {
					setImmediate(resolve);
				});
			}
		};

		let unhandledRejections: unknown[];
		const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason);

		beforeEach(() => {
			unhandledRejections = [];
			process.on('unhandledRejection', onUnhandledRejection);
		});

		afterEach(() => {
			process.off('unhandledRejection', onUnhandledRejection);
		});

		const gasPricingError = () =>
			new InvalidResponseError({
				jsonrpc: '2.0',
				id: 1,
				error: { code: -32000, message: 'gas pricing unavailable' },
			});

		it('rejects (rather than hanging) when getTransactionGasPricing rejects', async () => {
			const error = gasPricingError();
			jest.spyOn(GetTransactionGasPricing, 'getTransactionGasPricing').mockRejectedValue(
				error,
			);

			const outcome = await settleWithin(async () =>
				sendTransaction(
					web3Context,
					gasPricelessTransaction,
					DEFAULT_RETURN_FORMAT,
					sendOptions,
				),
			);

			expect(outcome).not.toBe(NOT_SETTLED);
			expect(outcome).toMatchObject({ status: 'rejected' });
			expect((outcome as { reason: unknown }).reason).toBe(error);
		});

		it('emits exactly one error event for a gas pricing failure when subscribed', async () => {
			const error = gasPricingError();
			jest.spyOn(GetTransactionGasPricing, 'getTransactionGasPricing').mockRejectedValue(
				error,
			);

			const promiEvent = sendTransaction(
				web3Context,
				gasPricelessTransaction,
				DEFAULT_RETURN_FORMAT,
				sendOptions,
			);
			const emitSpy = jest.spyOn(promiEvent, 'emit');
			const errorListener = jest.fn();
			promiEvent.on('error', errorListener);

			const outcome = await settleWithin(async () => promiEvent);
			await flushMacrotasks();

			expect(outcome).not.toBe(NOT_SETTLED);
			expect((outcome as { reason: unknown }).reason).toBe(error);
			expect(errorListener).toHaveBeenCalledTimes(1);
			expect(errorListener).toHaveBeenCalledWith(error);
			expect(countErrorEmits(emitSpy)).toBe(1);
		});

		it('emits no error event for a gas pricing failure when not subscribed', async () => {
			const error = gasPricingError();
			jest.spyOn(GetTransactionGasPricing, 'getTransactionGasPricing').mockRejectedValue(
				error,
			);

			const promiEvent = sendTransaction(
				web3Context,
				gasPricelessTransaction,
				DEFAULT_RETURN_FORMAT,
				sendOptions,
			);
			const emitSpy = jest.spyOn(promiEvent, 'emit');

			const outcome = await settleWithin(async () => promiEvent);
			await flushMacrotasks();

			expect(outcome).not.toBe(NOT_SETTLED);
			expect((outcome as { reason: unknown }).reason).toBe(error);
			expect(countErrorEmits(emitSpy)).toBe(0);
		});

		it('rejects without emitting error for an unclassified gas pricing failure', async () => {
			// The Promise rejection is authoritative; the error event is supplementary
			// and gated on the same typed-error classification used elsewhere.
			const error = new Error('boom');
			jest.spyOn(GetTransactionGasPricing, 'getTransactionGasPricing').mockRejectedValue(
				error,
			);

			const promiEvent = sendTransaction(
				web3Context,
				gasPricelessTransaction,
				DEFAULT_RETURN_FORMAT,
				sendOptions,
			);
			const emitSpy = jest.spyOn(promiEvent, 'emit');
			const errorListener = jest.fn();
			promiEvent.on('error', errorListener);

			const outcome = await settleWithin(async () => promiEvent);
			await flushMacrotasks();

			expect(outcome).not.toBe(NOT_SETTLED);
			expect((outcome as { reason: unknown }).reason).toBe(error);
			expect(errorListener).not.toHaveBeenCalled();
			expect(countErrorEmits(emitSpy)).toBe(0);
		});

		it('settles exactly once when the error normalization itself throws', async () => {
			// Exercises the last-resort guard on the executor: the catch block calls
			// getTransactionError, which can itself reject.
			web3Context.handleRevert = true;
			const normalizationError = new Error('getTransactionError failed');
			jest.spyOn(GetTransactionGasPricing, 'getTransactionGasPricing').mockRejectedValue(
				new ContractExecutionError({ code: -32000, message: 'execution reverted' }),
			);
			jest.spyOn(GetTransactionError, 'getTransactionError').mockRejectedValue(
				normalizationError,
			);

			const promiEvent = sendTransaction(
				web3Context,
				gasPricelessTransaction,
				DEFAULT_RETURN_FORMAT,
				sendOptions,
			);
			const emitSpy = jest.spyOn(promiEvent, 'emit');
			const errorListener = jest.fn();
			promiEvent.on('error', errorListener);

			const outcome = await settleWithin(async () => promiEvent);
			await flushMacrotasks();
			web3Context.handleRevert = false;

			expect(outcome).not.toBe(NOT_SETTLED);
			expect((outcome as { reason: unknown }).reason).toBe(normalizationError);
			expect(countErrorEmits(emitSpy)).toBe(0);
			expect(errorListener).not.toHaveBeenCalled();
		});

		it('reports no unhandledRejection for a gas pricing failure', async () => {
			jest.spyOn(GetTransactionGasPricing, 'getTransactionGasPricing').mockRejectedValue(
				gasPricingError(),
			);

			const promiEvent = sendTransaction(
				web3Context,
				gasPricelessTransaction,
				DEFAULT_RETURN_FORMAT,
				sendOptions,
			);
			// The caller's `await` is the only consumer; nothing else may leak.
			await expect(promiEvent).rejects.toThrow('gas pricing unavailable');
			await flushMacrotasks();

			expect(unhandledRejections).toStrictEqual([]);
		});
	});
});
