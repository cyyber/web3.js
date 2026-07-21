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

// Leaf module holding `getTransactionType`. It was split out of
// `transaction_builder.ts` so that `get_transaction_gas_pricing.ts` can consume
// it without forming a source-level import cycle with `transaction_builder.ts`
// (which imports `getTransactionGasPricing` from `get_transaction_gas_pricing.ts`).
// `transaction_builder.ts` re-exports this symbol, so its public export surface
// is unchanged.
import {
	QRLExecutionAPI,
	Transaction,
	FormatType,
	QRL_DATA_FORMAT,
} from '@theqrl/web3-types';
import { Web3Context } from '@theqrl/web3-core';
import { isNullish } from '@theqrl/web3-validator';
import { format } from '@theqrl/web3-utils';
import { detectTransactionType } from './detect_transaction_type.js';

export const getTransactionType = (
	transaction: FormatType<Transaction, typeof QRL_DATA_FORMAT>,
	web3Context: Web3Context<QRLExecutionAPI>,
) => {
	const inferredType = detectTransactionType(transaction, web3Context);

	if (!isNullish(inferredType)) return inferredType;
	if (!isNullish(web3Context.defaultTransactionType))
		return format({ format: 'uint' }, web3Context.defaultTransactionType, QRL_DATA_FORMAT);

	return undefined;
};
