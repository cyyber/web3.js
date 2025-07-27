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

// Disabling because returnTypes must be last param to match 1.x params
/* eslint-disable default-param-last */
import {
	QRL_DATA_FORMAT,
	FormatType,
	DataFormat,
	DEFAULT_RETURN_FORMAT,
	QRLExecutionAPI,
	TransactionWithSenderAPI,
	SignedTransactionInfoAPI,
	Web3BaseWalletAccount,
	Address,
	BlockTag,
	BlockNumberOrTag,
	Bytes,
	Filter,
	HexString,
	Numbers,
	HexStringBytes,
	AccountObject,
	Block,
	FeeHistory,
	Log,
	TransactionReceipt,
	Transaction,
	TransactionCall,
	Web3QRLExecutionAPI,
	TransactionWithFromLocalWalletIndex,
	TransactionWithToLocalWalletIndex,
	TransactionWithFromAndToLocalWalletIndex,
	TransactionForAccessList,
	AccessListResult,
	Eip712TypedData,
} from '@theqrl/web3-types';
import { Web3Context, Web3PromiEvent } from '@theqrl/web3-core';
import { format, hexToBytes, bytesToUint8Array, numberToHex } from '@theqrl/web3-utils';
import { TransactionFactory } from '@theqrl/web3-qrl-accounts';
import { isBlockTag, isBytes, isNullish, isString } from '@theqrl/web3-validator';
import {
	ContractExecutionError,
	InvalidResponseError,
	SignatureError,
	TransactionRevertedWithoutReasonError,
	TransactionRevertInstructionError,
	TransactionRevertWithCustomError,
} from '@theqrl/web3-errors';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';

import { decodeSignedTransaction } from './utils/decode_signed_transaction.js';
import {
	accountSchema,
	blockSchema,
	feeHistorySchema,
	logSchema,
	transactionReceiptSchema,
	accessListResultSchema,
	SignatureObjectSchema,
} from './schemas.js';
import {
	SendSignedTransactionEvents,
	SendSignedTransactionOptions,
	SendTransactionEvents,
	SendTransactionOptions,
} from './types.js';
// eslint-disable-next-line import/no-cycle
import { getTransactionFromOrToAttr } from './utils/transaction_builder.js';
import { formatTransaction } from './utils/format_transaction.js';
// eslint-disable-next-line import/no-cycle
import { getTransactionGasPricing } from './utils/get_transaction_gas_pricing.js';
// eslint-disable-next-line import/no-cycle
import { trySendTransaction } from './utils/try_send_transaction.js';
// eslint-disable-next-line import/no-cycle
import { waitForTransactionReceipt } from './utils/wait_for_transaction_receipt.js';
import { watchTransactionForConfirmations } from './utils/watch_transaction_for_confirmations.js';
import { NUMBER_DATA_FORMAT } from './constants.js';
// eslint-disable-next-line import/no-cycle
import { getTransactionError } from './utils/get_transaction_error.js';
// eslint-disable-next-line import/no-cycle
import { getRevertReason } from './utils/get_revert_reason.js';

/**
 * View additional documentations here: {@link Web3QRL.getProtocolVersion}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export const getProtocolVersion = async (web3Context: Web3Context<QRLExecutionAPI>) =>
	qrlRpcMethods.getProtocolVersion(web3Context.requestManager);

// TODO Add returnFormat parameter
/**
 * View additional documentations here: {@link Web3QRL.isSyncing}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export const isSyncing = async (web3Context: Web3Context<QRLExecutionAPI>) =>
	qrlRpcMethods.getSyncing(web3Context.requestManager);

/**
 * View additional documentations here: {@link Web3QRL.getGasPrice}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getGasPrice<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.getGasPrice(web3Context.requestManager);

	return format({ format: 'uint' }, response as Numbers, returnFormat);
}

export async function getMaxPriorityFeePerGas<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.getMaxPriorityFeePerGas(web3Context.requestManager);

	return format({ format: 'uint' }, response as Numbers, returnFormat);
}
/**
 * View additional documentations here: {@link Web3QRL.getBlockNumber}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getBlockNumber<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.getBlockNumber(web3Context.requestManager);

	return format({ format: 'uint' }, response as Numbers, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.getBalance}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getBalance<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	address: Address,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);
	const response = await qrlRpcMethods.getBalance(
		web3Context.requestManager,
		address,
		blockNumberFormatted,
	);
	return format({ format: 'uint' }, response as Numbers, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.getStorageAt}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getStorageAt<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	address: Address,
	storageSlot: Numbers,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const storageSlotFormatted = format({ format: 'uint' }, storageSlot, QRL_DATA_FORMAT);
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);
	const response = await qrlRpcMethods.getStorageAt(
		web3Context.requestManager,
		address,
		storageSlotFormatted,
		blockNumberFormatted,
	);
	return format({ format: 'bytes' }, response as Bytes, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.getCode}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getCode<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	address: Address,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);
	const response = await qrlRpcMethods.getCode(
		web3Context.requestManager,
		address,
		blockNumberFormatted,
	);
	return format({ format: 'bytes' }, response as Bytes, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.getBlock}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getBlock<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	block: Bytes | BlockNumberOrTag = web3Context.defaultBlock,
	hydrated = false,
	returnFormat: ReturnFormat,
) {
	let response;
	if (isBytes(block)) {
		const blockHashFormatted = format({ format: 'bytes32' }, block, QRL_DATA_FORMAT);
		response = await qrlRpcMethods.getBlockByHash(
			web3Context.requestManager,
			blockHashFormatted as HexString,
			hydrated,
		);
	} else {
		const blockNumberFormatted = isBlockTag(block as string)
			? (block as BlockTag)
			: format({ format: 'uint' }, block as Numbers, QRL_DATA_FORMAT);
		response = await qrlRpcMethods.getBlockByNumber(
			web3Context.requestManager,
			blockNumberFormatted,
			hydrated,
		);
	}
	return format(blockSchema, response as unknown as Block, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.getBlockTransactionCount}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getBlockTransactionCount<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	block: Bytes | BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	let response;
	if (isBytes(block)) {
		const blockHashFormatted = format({ format: 'bytes32' }, block, QRL_DATA_FORMAT);
		response = await qrlRpcMethods.getBlockTransactionCountByHash(
			web3Context.requestManager,
			blockHashFormatted as HexString,
		);
	} else {
		const blockNumberFormatted = isBlockTag(block as string)
			? (block as BlockTag)
			: format({ format: 'uint' }, block as Numbers, QRL_DATA_FORMAT);
		response = await qrlRpcMethods.getBlockTransactionCountByNumber(
			web3Context.requestManager,
			blockNumberFormatted,
		);
	}

	return format({ format: 'uint' }, response as Numbers, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.getTransaction}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getTransaction<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transactionHash: Bytes,
	returnFormat: ReturnFormat,
) {
	const transactionHashFormatted = format(
		{ format: 'bytes32' },
		transactionHash,
		DEFAULT_RETURN_FORMAT,
	);
	const response = await qrlRpcMethods.getTransactionByHash(
		web3Context.requestManager,
		transactionHashFormatted,
	);

	return isNullish(response)
		? response
		: formatTransaction(response, returnFormat, { fillInputAndData: true });
}

/**
 * View additional documentations here: {@link Web3QRL.getPendingTransactions}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getPendingTransactions<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.getPendingTransactions(web3Context.requestManager);

	return response.map(transaction =>
		formatTransaction(transaction as unknown as Transaction, returnFormat, {
			fillInputAndData: true,
		}),
	);
}

/**
 * View additional documentations here: {@link Web3QRL.getTransactionFromBlock}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getTransactionFromBlock<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	block: Bytes | BlockNumberOrTag = web3Context.defaultBlock,
	transactionIndex: Numbers,
	returnFormat: ReturnFormat,
) {
	const transactionIndexFormatted = format(
		{ format: 'uint' },
		transactionIndex,
		QRL_DATA_FORMAT,
	);

	let response;
	if (isBytes(block)) {
		const blockHashFormatted = format({ format: 'bytes32' }, block, QRL_DATA_FORMAT);
		response = await qrlRpcMethods.getTransactionByBlockHashAndIndex(
			web3Context.requestManager,
			blockHashFormatted as HexString,
			transactionIndexFormatted,
		);
	} else {
		const blockNumberFormatted = isBlockTag(block as string)
			? (block as BlockTag)
			: format({ format: 'uint' }, block as Numbers, QRL_DATA_FORMAT);
		response = await qrlRpcMethods.getTransactionByBlockNumberAndIndex(
			web3Context.requestManager,
			blockNumberFormatted,
			transactionIndexFormatted,
		);
	}

	return isNullish(response)
		? response
		: formatTransaction(response, returnFormat, { fillInputAndData: true });
}

/**
 * View additional documentations here: {@link Web3QRL.getTransactionReceipt}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getTransactionReceipt<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transactionHash: Bytes,
	returnFormat: ReturnFormat,
) {
	const transactionHashFormatted = format(
		{ format: 'bytes32' },
		transactionHash,
		DEFAULT_RETURN_FORMAT,
	);
	const response = await qrlRpcMethods.getTransactionReceipt(
		web3Context.requestManager,
		transactionHashFormatted,
	);

	return isNullish(response)
		? response
		: (format(
				transactionReceiptSchema,
				response as unknown as TransactionReceipt,
				returnFormat,
		  ) as TransactionReceipt);
}

/**
 * View additional documentations here: {@link Web3QRL.getTransactionCount}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getTransactionCount<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	address: Address,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);
	const response = await qrlRpcMethods.getTransactionCount(
		web3Context.requestManager,
		address,
		blockNumberFormatted,
	);

	return format({ format: 'uint' }, response as Numbers, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.sendTransaction}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export function sendTransaction<
	ReturnFormat extends DataFormat,
	ResolveType = FormatType<TransactionReceipt, ReturnFormat>,
>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transaction:
		| Transaction
		| TransactionWithFromLocalWalletIndex
		| TransactionWithToLocalWalletIndex
		| TransactionWithFromAndToLocalWalletIndex,
	returnFormat: ReturnFormat,
	options: SendTransactionOptions<ResolveType> = { checkRevertBeforeSending: true },
): Web3PromiEvent<ResolveType, SendTransactionEvents<ReturnFormat>> {
	const promiEvent = new Web3PromiEvent<ResolveType, SendTransactionEvents<ReturnFormat>>(
		(resolve, reject) => {
			setImmediate(() => {
				(async () => {
					let transactionFormatted = formatTransaction(
						{
							...transaction,
							from: getTransactionFromOrToAttr('from', web3Context, transaction),
							to: getTransactionFromOrToAttr('to', web3Context, transaction),
						},
						QRL_DATA_FORMAT,
					);

					if (
						!options?.ignoreGasPricing &&
						(isNullish(transaction.maxPriorityFeePerGas) ||
							isNullish(transaction.maxFeePerGas))
					) {
						transactionFormatted = {
							...transactionFormatted,
							// TODO maxPriorityFeePerGas, maxFeePerGas
							// should not be included if undefined, but currently are
							...(await getTransactionGasPricing(
								transactionFormatted,
								web3Context,
								QRL_DATA_FORMAT,
							)),
						};
					}
					try {
						if (options.checkRevertBeforeSending !== false) {
							const reason = await getRevertReason(
								web3Context,
								transactionFormatted as TransactionCall,
								options.contractAbi,
							);
							if (reason !== undefined) {
								const error = await getTransactionError<ReturnFormat>(
									web3Context,
									transactionFormatted as TransactionCall,
									undefined,
									undefined,
									options.contractAbi,
									reason,
								);

								if (promiEvent.listenerCount('error') > 0) {
									promiEvent.emit('error', error);
								}

								reject(error);
								return;
							}
						}

						if (promiEvent.listenerCount('sending') > 0) {
							promiEvent.emit('sending', transactionFormatted);
						}

						let transactionHash: HexString;
						let wallet: Web3BaseWalletAccount | undefined;

						if (web3Context.wallet && !isNullish(transactionFormatted.from)) {
							wallet = web3Context.wallet.get(transactionFormatted.from);
						}

						if (wallet) {
							const signedTransaction = await wallet.signTransaction(
								transactionFormatted,
							);

							transactionHash = await trySendTransaction(
								web3Context,
								async (): Promise<string> =>
									qrlRpcMethods.sendRawTransaction(
										web3Context.requestManager,
										signedTransaction.rawTransaction,
									),
								signedTransaction.transactionHash,
							);
						} else {
							transactionHash = await trySendTransaction(
								web3Context,
								async (): Promise<string> =>
									qrlRpcMethods.sendTransaction(
										web3Context.requestManager,
										transactionFormatted as Partial<TransactionWithSenderAPI>,
									),
							);
						}

						const transactionHashFormatted = format(
							{ format: 'bytes32' },
							transactionHash as Bytes,
							returnFormat,
						);

						if (promiEvent.listenerCount('sent') > 0) {
							promiEvent.emit('sent', transactionFormatted);
						}

						if (promiEvent.listenerCount('transactionHash') > 0) {
							promiEvent.emit('transactionHash', transactionHashFormatted);
						}

						const transactionReceipt = await waitForTransactionReceipt(
							web3Context,
							transactionHash,
							returnFormat,
						);

						const transactionReceiptFormatted = format(
							transactionReceiptSchema,
							transactionReceipt,
							returnFormat,
						);

						if (promiEvent.listenerCount('receipt') > 0) {
							promiEvent.emit('receipt', transactionReceiptFormatted);
						}

						if (options?.transactionResolver) {
							resolve(
								options?.transactionResolver(
									transactionReceiptFormatted,
								) as unknown as ResolveType,
							);
						} else if (transactionReceipt.status === BigInt(0)) {
							const error = await getTransactionError<ReturnFormat>(
								web3Context,
								transactionFormatted as TransactionCall,
								transactionReceiptFormatted,
								undefined,
								options?.contractAbi,
							);

							if (promiEvent.listenerCount('error') > 0) {
								promiEvent.emit('error', error);
							}

							reject(error);
						} else {
							resolve(transactionReceiptFormatted as unknown as ResolveType);
						}

						if (promiEvent.listenerCount('confirmation') > 0) {
							watchTransactionForConfirmations<
								ReturnFormat,
								SendTransactionEvents<ReturnFormat>,
								ResolveType
							>(
								web3Context,
								promiEvent,
								transactionReceiptFormatted as TransactionReceipt,
								transactionHash,
								returnFormat,
							);
						}
					} catch (error) {
						let _error = error;

						if (_error instanceof ContractExecutionError && web3Context.handleRevert) {
							_error = await getTransactionError(
								web3Context,
								transactionFormatted as TransactionCall,
								undefined,
								undefined,
								options?.contractAbi,
							);
						}

						if (
							(_error instanceof InvalidResponseError ||
								_error instanceof ContractExecutionError ||
								_error instanceof TransactionRevertWithCustomError ||
								_error instanceof TransactionRevertedWithoutReasonError ||
								_error instanceof TransactionRevertInstructionError) &&
							promiEvent.listenerCount('error') > 0
						) {
							promiEvent.emit('error', _error);
						}

						reject(_error);
					}
				})() as unknown;
			});
		},
	);

	return promiEvent;
}

/**
 * View additional documentations here: {@link Web3QRL.sendSignedTransaction}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export function sendSignedTransaction<
	ReturnFormat extends DataFormat,
	ResolveType = FormatType<TransactionReceipt, ReturnFormat>,
>(
	web3Context: Web3Context<QRLExecutionAPI>,
	signedTransaction: Bytes,
	returnFormat: ReturnFormat,
	options: SendSignedTransactionOptions<ResolveType> = { checkRevertBeforeSending: true },
): Web3PromiEvent<ResolveType, SendSignedTransactionEvents<ReturnFormat>> {
	// TODO - Promise returned in function argument where a void return was expected
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	const promiEvent = new Web3PromiEvent<ResolveType, SendSignedTransactionEvents<ReturnFormat>>(
		(resolve, reject) => {
			setImmediate(() => {
				(async () => {
					// Formatting signedTransaction to be send to RPC endpoint
					const signedTransactionFormattedHex = format(
						{ format: 'bytes' },
						signedTransaction,
						QRL_DATA_FORMAT,
					);
					const unSerializedTransaction = TransactionFactory.fromSerializedData(
						bytesToUint8Array(hexToBytes(signedTransactionFormattedHex)),
					);
					const unSerializedTransactionWithFrom = {
						...unSerializedTransaction.toJSON(),
						// Some providers will default `from` to address(0) causing the error
						// reported from `qrl_call` to not be the reason the user's tx failed
						// e.g. `qrl_call` will return an Out of Gas error for a failed
						// smart contract execution contract, because the sender, address(0),
						// has no balance to pay for the gas of the transaction execution
						from: unSerializedTransaction.getSenderAddress().toString(),
					};

					try {
						if (options.checkRevertBeforeSending !== false) {
							const reason = await getRevertReason(
								web3Context,
								unSerializedTransactionWithFrom as TransactionCall,
								options.contractAbi,
							);
							if (reason !== undefined) {
								const error = await getTransactionError<ReturnFormat>(
									web3Context,
									unSerializedTransactionWithFrom as TransactionCall,
									undefined,
									undefined,
									options.contractAbi,
									reason,
								);

								if (promiEvent.listenerCount('error') > 0) {
									promiEvent.emit('error', error);
								}

								reject(error);
								return;
							}
						}

						if (promiEvent.listenerCount('sending') > 0) {
							promiEvent.emit('sending', signedTransactionFormattedHex);
						}

						const transactionHash = await trySendTransaction(
							web3Context,
							async (): Promise<string> =>
								qrlRpcMethods.sendRawTransaction(
									web3Context.requestManager,
									signedTransactionFormattedHex,
								),
						);

						if (promiEvent.listenerCount('sent') > 0) {
							promiEvent.emit('sent', signedTransactionFormattedHex);
						}

						const transactionHashFormatted = format(
							{ format: 'bytes32' },
							transactionHash as Bytes,
							returnFormat,
						);

						if (promiEvent.listenerCount('transactionHash') > 0) {
							promiEvent.emit('transactionHash', transactionHashFormatted);
						}

						const transactionReceipt = await waitForTransactionReceipt(
							web3Context,
							transactionHash,
							returnFormat,
						);

						const transactionReceiptFormatted = format(
							transactionReceiptSchema,
							transactionReceipt,
							returnFormat,
						);

						if (promiEvent.listenerCount('receipt') > 0) {
							promiEvent.emit('receipt', transactionReceiptFormatted);
						}

						if (options?.transactionResolver) {
							resolve(
								options?.transactionResolver(
									transactionReceiptFormatted,
								) as unknown as ResolveType,
							);
						} else if (transactionReceipt.status === BigInt(0)) {
							const error = await getTransactionError<ReturnFormat>(
								web3Context,
								unSerializedTransactionWithFrom as TransactionCall,
								transactionReceiptFormatted,
								undefined,
								options?.contractAbi,
							);

							if (promiEvent.listenerCount('error') > 0) {
								promiEvent.emit('error', error);
							}

							reject(error);
						} else {
							resolve(transactionReceiptFormatted as unknown as ResolveType);
						}

						if (promiEvent.listenerCount('confirmation') > 0) {
							watchTransactionForConfirmations<
								ReturnFormat,
								SendSignedTransactionEvents<ReturnFormat>,
								ResolveType
							>(
								web3Context,
								promiEvent,
								transactionReceiptFormatted as TransactionReceipt,
								transactionHash,
								returnFormat,
							);
						}
					} catch (error) {
						let _error = error;

						if (_error instanceof ContractExecutionError && web3Context.handleRevert) {
							_error = await getTransactionError(
								web3Context,
								unSerializedTransactionWithFrom as TransactionCall,
								undefined,
								undefined,
								options?.contractAbi,
							);
						}

						if (
							(_error instanceof InvalidResponseError ||
								_error instanceof ContractExecutionError ||
								_error instanceof TransactionRevertWithCustomError ||
								_error instanceof TransactionRevertedWithoutReasonError ||
								_error instanceof TransactionRevertInstructionError) &&
							promiEvent.listenerCount('error') > 0
						) {
							promiEvent.emit('error', _error);
						}

						reject(_error);
					}
				})() as unknown;
			});
		},
	);

	return promiEvent;
}

/**
 * View additional documentations here: {@link Web3QRL.sign}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function sign<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	message: Bytes,
	addressOrIndex: Address | number,
	returnFormat: ReturnFormat,
) {
	const messageFormatted = format({ format: 'bytes' }, message, DEFAULT_RETURN_FORMAT);
	if (web3Context.wallet?.get(addressOrIndex)) {
		const wallet = web3Context.wallet.get(addressOrIndex) as Web3BaseWalletAccount;
		const signed = wallet.sign(messageFormatted);
		return format(SignatureObjectSchema, signed, returnFormat);
	}

	if (typeof addressOrIndex === 'number') {
		throw new SignatureError(
			message,
			'RPC method "qrl_sign" does not support index signatures',
		);
	}

	const response = await qrlRpcMethods.sign(
		web3Context.requestManager,
		addressOrIndex,
		messageFormatted,
	);

	return format({ format: 'bytes' }, response as Bytes, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.signTransaction}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function signTransaction<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transaction: Transaction,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.signTransaction(
		web3Context.requestManager,
		formatTransaction(transaction, QRL_DATA_FORMAT),
	);
	// Some clients only return the encoded signed transaction (e.g. Ganache)
	// while clients such as Gzond return the desired SignedTransactionInfoAPI object
	return isString(response as HexStringBytes)
		? decodeSignedTransaction(response as HexStringBytes, returnFormat, {
				fillInputAndData: true,
		  })
		: {
				raw: format(
					{ format: 'bytes' },
					(response as SignedTransactionInfoAPI).raw,
					returnFormat,
				),
				tx: formatTransaction((response as SignedTransactionInfoAPI).tx, returnFormat, {
					fillInputAndData: true,
				}),
		  };
}

// TODO Decide what to do with transaction.to
// https://github.com/theqrl/web3.js/pull/4525#issuecomment-982330076
/**
 * View additional documentations here: {@link Web3QRL.call}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function call<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transaction: TransactionCall,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);

	const response = await qrlRpcMethods.call(
		web3Context.requestManager,
		formatTransaction(transaction, QRL_DATA_FORMAT),
		blockNumberFormatted,
	);

	return format({ format: 'bytes' }, response as Bytes, returnFormat);
}

// TODO - Investigate whether response is padded as 1.x docs suggest
/**
 * View additional documentations here: {@link Web3QRL.estimateGas}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function estimateGas<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transaction: Transaction,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const transactionFormatted = formatTransaction(transaction, QRL_DATA_FORMAT);
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);

	const response = await qrlRpcMethods.estimateGas(
		web3Context.requestManager,
		transactionFormatted,
		blockNumberFormatted,
	);

	return format({ format: 'uint' }, response as Numbers, returnFormat);
}

// TODO - Add input formatting to filter
/**
 * View additional documentations here: {@link Web3QRL.getPastLogs}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getLogs<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<Web3QRLExecutionAPI>,
	filter: Filter,
	returnFormat: ReturnFormat,
) {
	// format type bigint or number toBlock and fromBlock to hexstring.
	let { toBlock, fromBlock } = filter;
	if (!isNullish(toBlock)) {
		if (typeof toBlock === 'number' || typeof toBlock === 'bigint') {
			toBlock = numberToHex(toBlock);
		}
	}
	if (!isNullish(fromBlock)) {
		if (typeof fromBlock === 'number' || typeof fromBlock === 'bigint') {
			fromBlock = numberToHex(fromBlock);
		}
	}

	const formattedFilter = { ...filter, fromBlock, toBlock };

	const response = await qrlRpcMethods.getLogs(web3Context.requestManager, formattedFilter);

	const result = response.map(res => {
		if (typeof res === 'string') {
			return res;
		}

		return format(logSchema, res as unknown as Log, returnFormat);
	});

	return result;
}

/**
 * View additional documentations here: {@link Web3QRL.getChainId}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getChainId<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.getChainId(web3Context.requestManager);

	return format(
		{ format: 'uint' },
		// Response is number in hex formatted string
		response as unknown as number,
		returnFormat,
	);
}

/**
 * View additional documentations here: {@link Web3QRL.getProof}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getProof<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<Web3QRLExecutionAPI>,
	address: Address,
	storageKeys: Bytes[],
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const storageKeysFormatted = storageKeys.map(storageKey =>
		format({ format: 'bytes' }, storageKey, QRL_DATA_FORMAT),
	);

	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);

	const response = await qrlRpcMethods.getProof(
		web3Context.requestManager,
		address,
		storageKeysFormatted,
		blockNumberFormatted,
	);

	return format(accountSchema, response as unknown as AccountObject, returnFormat);
}

// TODO Throwing an error with Gzond, but not Infura
// TODO gasUsedRatio and reward not formatting
/**
 * View additional documentations here: {@link Web3QRL.getFeeHistory}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function getFeeHistory<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	blockCount: Numbers,
	newestBlock: BlockNumberOrTag = web3Context.defaultBlock,
	rewardPercentiles: Numbers[],
	returnFormat: ReturnFormat,
) {
	const blockCountFormatted = format({ format: 'uint' }, blockCount, QRL_DATA_FORMAT);

	const newestBlockFormatted = isBlockTag(newestBlock as string)
		? (newestBlock as BlockTag)
		: format({ format: 'uint' }, newestBlock as Numbers, QRL_DATA_FORMAT);

	const rewardPercentilesFormatted = format(
		{
			type: 'array',
			items: {
				format: 'uint',
			},
		},
		rewardPercentiles,
		NUMBER_DATA_FORMAT,
	);

	const response = await qrlRpcMethods.getFeeHistory(
		web3Context.requestManager,
		blockCountFormatted,
		newestBlockFormatted,
		rewardPercentilesFormatted,
	);

	return format(feeHistorySchema, response as unknown as FeeHistory, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.createAccessList}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function createAccessList<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	transaction: TransactionForAccessList,
	blockNumber: BlockNumberOrTag = web3Context.defaultBlock,
	returnFormat: ReturnFormat,
) {
	const blockNumberFormatted = isBlockTag(blockNumber as string)
		? (blockNumber as BlockTag)
		: format({ format: 'uint' }, blockNumber as Numbers, QRL_DATA_FORMAT);

	const response = (await qrlRpcMethods.createAccessList(
		web3Context.requestManager,
		formatTransaction(transaction, QRL_DATA_FORMAT),
		blockNumberFormatted,
	)) as unknown as AccessListResult;

	return format(accessListResultSchema, response, returnFormat);
}

/**
 * View additional documentations here: {@link Web3QRL.signTypedData}
 * @param web3Context ({@link Web3Context}) Web3 configuration object that contains things such as the provider, request manager, wallet, etc.
 */
export async function signTypedData<ReturnFormat extends DataFormat>(
	web3Context: Web3Context<QRLExecutionAPI>,
	address: Address,
	typedData: Eip712TypedData,
	useLegacy: boolean,
	returnFormat: ReturnFormat,
) {
	const response = await qrlRpcMethods.signTypedData(
		web3Context.requestManager,
		address,
		typedData,
		useLegacy,
	);

	return format({ format: 'bytes' }, response, returnFormat);
}
