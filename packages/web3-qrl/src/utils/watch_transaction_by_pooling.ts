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
	Bytes,
	DataFormat,
	Numbers,
	QRLExecutionAPI,
	TransactionReceipt,
} from '@theqrl/web3-types';
import { Web3Context, Web3PromiEvent } from '@theqrl/web3-core';
import { format, numberToHex } from '@theqrl/web3-utils';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';

import { SendSignedTransactionEvents, SendTransactionEvents } from '../types.js';
import { transactionReceiptSchema } from '../schemas.js';

export type Web3PromiEventEventTypeBase<ReturnFormat extends DataFormat> =
	| SendTransactionEvents<ReturnFormat>
	| SendSignedTransactionEvents<ReturnFormat>;

export type WaitProps<ReturnFormat extends DataFormat, ResolveType = TransactionReceipt> = {
	web3Context: Web3Context<QRLExecutionAPI>;
	transactionReceipt: TransactionReceipt;
	transactionPromiEvent: Web3PromiEvent<ResolveType, Web3PromiEventEventTypeBase<ReturnFormat>>;
	returnFormat: ReturnFormat;
};

/**
 * This function watches a Transaction by subscribing to new heads.
 * It is used by `watchTransactionForConfirmations`, in case the provider does not support subscription.
 * And it is also used by `watchTransactionBySubscription`, as a fallback, if the subscription failed for any reason.
 */
export const watchTransactionByPolling = <
	ReturnFormat extends DataFormat,
	ResolveType = TransactionReceipt,
>({
	web3Context,
	transactionReceipt,
	transactionPromiEvent,
	returnFormat,
}: WaitProps<ReturnFormat, ResolveType>) => {
	// Having a transactionReceipt means that the transaction has already been included
	// in at least one block, so we start with 1
	let confirmations = 1;
	const intervalId = setInterval(() => {
		// Attach error handling to the async work so that a failed block fetch does not
		// turn into an unhandled promise rejection that loops forever. On a fatal error we
		// stop the poller (clearInterval) and surface the error via the promiEvent.
		void (async () => {
			if (confirmations >= web3Context.transactionConfirmationBlocks)
				clearInterval(intervalId);

			const nextBlock = await qrlRpcMethods.getBlockByNumber(
				web3Context.requestManager,
				numberToHex(BigInt(transactionReceipt.blockNumber) + BigInt(confirmations)),
				false,
			);

			if (nextBlock?.hash) {
				confirmations += 1;
				const formattedConfirmations: Numbers = confirmations;

				transactionPromiEvent.emit('confirmation', {
					confirmations: format({ format: 'uint' }, formattedConfirmations, returnFormat),
					receipt: format(transactionReceiptSchema, transactionReceipt, returnFormat),
					latestBlockHash: format(
						{ format: 'bytes32' },
						nextBlock.hash as Bytes,
						returnFormat,
					),
				});
			}
		})().catch(error => {
			// Stop polling on a fatal error to avoid an infinite loop of unhandled rejections.
			clearInterval(intervalId);
			transactionPromiEvent.emit(
				'error',
				error as Web3PromiEventEventTypeBase<ReturnFormat>['error'],
			);
		});
	}, web3Context.transactionReceiptPollingInterval ?? web3Context.transactionPollingInterval);
};
