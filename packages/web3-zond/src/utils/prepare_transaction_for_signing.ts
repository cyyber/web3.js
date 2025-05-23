﻿/*
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
	ZondExecutionAPI,
	HexString,
	PopulatedUnsignedTransaction,
	Transaction,
	ValidChains,
	FormatType,
	ZOND_DATA_FORMAT,
} from '@theqrl/web3-types';
import { Web3Context } from '@theqrl/web3-core';
import { toNumber } from '@theqrl/web3-utils';
import { TransactionFactory, TxOptions, Common } from '@theqrl/web3-zond-accounts';
import { isNullish } from '@theqrl/web3-validator';
import { validateTransactionForSigning } from '../validation.js';
import { formatTransaction } from './format_transaction.js';
import { transactionBuilder } from './transaction_builder.js';

const getZondjsTxDataFromTransaction = (
	transaction: FormatType<PopulatedUnsignedTransaction, typeof ZOND_DATA_FORMAT>,
) => ({
	nonce: transaction.nonce,
	gasLimit: transaction.gasLimit ?? transaction.gas,
	to: transaction.to,
	value: transaction.value,
	data: transaction.data ?? transaction.input,
	type: transaction.type,
	chainId: transaction.chainId,
	accessList: (
		transaction 
	).accessList,
	maxPriorityFeePerGas: (
		transaction 
	).maxPriorityFeePerGas,
	maxFeePerGas: (
		transaction 
	).maxFeePerGas,
});

const getZondjsTransactionOptions = (
	transaction: FormatType<PopulatedUnsignedTransaction, typeof ZOND_DATA_FORMAT>,
	web3Context: Web3Context<ZondExecutionAPI>,
) => {
	const hasTransactionSigningOptions =
		(!isNullish(transaction.chain) && !isNullish(transaction.hardfork)) ||
		!isNullish(transaction.common);

	let common;
	if (!hasTransactionSigningOptions) {
		// if defaultcommon is specified, use that.
		if (web3Context.defaultCommon) {
			common = web3Context.defaultCommon;

			if (isNullish(common.hardfork))
				common.hardfork = transaction.hardfork ?? web3Context.defaultHardfork;
			if (isNullish(common.baseChain))
				common.baseChain = web3Context.defaultChain as ValidChains;
		} else {
			common = Common.custom(
				{
					name: 'custom-network',
					chainId: toNumber(transaction.chainId) as number,
					networkId: !isNullish(transaction.networkId)
						? (toNumber(transaction.networkId) as number)
						: undefined,
					defaultHardfork: transaction.hardfork ?? web3Context.defaultHardfork,
				},
				{
					baseChain: web3Context.defaultChain,
				},
			);
		}
	} else {
		const name =
			transaction?.common?.customChain?.name ?? transaction.chain ?? 'custom-network';
		const chainId = toNumber(
			transaction?.common?.customChain?.chainId ?? transaction?.chainId,
		) as number;
		const networkId = toNumber(
			transaction?.common?.customChain?.networkId ?? transaction?.networkId,
		) as number;
		const defaultHardfork =
			transaction?.common?.hardfork ?? transaction?.hardfork ?? web3Context.defaultHardfork;
		const baseChain =
			transaction.common?.baseChain ?? transaction.chain ?? web3Context.defaultChain;

		if (chainId && networkId && name) {
			common = Common.custom(
				{
					name,
					chainId,
					networkId,
					defaultHardfork,
				},
				{
					baseChain,
				},
			);
		}
	}
	return { common } as TxOptions;
};

export const prepareTransactionForSigning = async (
	transaction: Transaction,
	web3Context: Web3Context<ZondExecutionAPI>,
	seed?: HexString | Uint8Array,
	fillGasPrice = false,
	fillGasLimit = true,
) => {
	const populatedTransaction = (await transactionBuilder({
		transaction,
		web3Context,
		seed,
		fillGasPrice,
		fillGasLimit,
	})) as unknown as PopulatedUnsignedTransaction;
	const formattedTransaction = formatTransaction(
		populatedTransaction,
		ZOND_DATA_FORMAT,
	) as unknown as FormatType<PopulatedUnsignedTransaction, typeof ZOND_DATA_FORMAT>;
	validateTransactionForSigning(
		formattedTransaction as unknown as FormatType<Transaction, typeof ZOND_DATA_FORMAT>,
	);

	return TransactionFactory.fromTxData(
		getZondjsTxDataFromTransaction(formattedTransaction),
		getZondjsTransactionOptions(formattedTransaction, web3Context),
	);
};
