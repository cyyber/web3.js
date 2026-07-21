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
import {
	QRLExecutionAPI,
	Numbers,
	Transaction,
	DataFormat,
	FormatType,
	QRL_DATA_FORMAT,
} from '@theqrl/web3-types';
import { isNullish } from '@theqrl/web3-validator';
import { UnsupportedTransactionTypeError } from '@theqrl/web3-errors';
import { format } from '@theqrl/web3-utils';
import { getBlock } from './rpc_method_wrappers_readers.js';
import { InternalTransaction } from '../types.js';
import { getTransactionType } from './get_transaction_type.js';

// 256-bit unsigned upper bound; on-chain fee fields are uint256.
const MAX_UINT256 = (BigInt(1) << BigInt(256)) - BigInt(1);

const safeBigInt = (value: Numbers | undefined, label: string): bigint => {
	if (isNullish(value)) {
		throw new Error(`Expected numeric ${label}, got ${String(value)}`);
	}
	if (typeof value === 'string' && value.startsWith('-')) {
		throw new Error(`Negative ${label} from RPC: ${value}`);
	}
	const result = BigInt(value);
	if (result < BigInt(0) || result > MAX_UINT256) {
		throw new Error(`${label} out of uint256 range: ${result.toString()}`);
	}
	return result;
};

async function getEip1559GasPricing<ReturnFormat extends DataFormat>(
	transaction: FormatType<Transaction, typeof QRL_DATA_FORMAT>,
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
): Promise<FormatType<{ maxPriorityFeePerGas?: Numbers; maxFeePerGas?: Numbers }, ReturnFormat>> {
	const block = await getBlock(web3Context, web3Context.defaultBlock, false, returnFormat);

	const baseFeePerGas = safeBigInt(block.baseFeePerGas as Numbers, 'block.baseFeePerGas');
	const maxPriorityFeePerGas = safeBigInt(
		(transaction.maxPriorityFeePerGas ?? web3Context.defaultMaxPriorityFeePerGas) as Numbers,
		'maxPriorityFeePerGas',
	);

	return {
		maxPriorityFeePerGas: format(
			{ format: 'uint' },
			maxPriorityFeePerGas as Numbers,
			returnFormat,
		),
		maxFeePerGas: format(
			{ format: 'uint' },
			(transaction.maxFeePerGas ?? baseFeePerGas * BigInt(2) + maxPriorityFeePerGas) as Numbers,
			returnFormat,
		),
	};
}

export async function getTransactionGasPricing<ReturnFormat extends DataFormat>(
	transaction: InternalTransaction,
	web3Context: Web3Context<QRLExecutionAPI>,
	returnFormat: ReturnFormat,
): Promise<
	FormatType<{ maxPriorityFeePerGas?: Numbers; maxFeePerGas?: Numbers }, ReturnFormat> | undefined
> {
	const transactionType = getTransactionType(transaction, web3Context);
	if (!isNullish(transactionType)) {
		if (transactionType.startsWith('-'))
			throw new UnsupportedTransactionTypeError(transactionType);

		if (transactionType !== '0x2') throw new UnsupportedTransactionTypeError(transactionType);

		return {
			...(await getEip1559GasPricing(transaction, web3Context, returnFormat)),
		};
	}

	return undefined;
}
