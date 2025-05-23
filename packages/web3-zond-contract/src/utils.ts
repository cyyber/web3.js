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

import { Web3ContractError } from '@theqrl/web3-errors';
import {
	TransactionForAccessList,
	AbiFunctionFragment,
	TransactionWithSenderAPI,
	TransactionCall,
	HexString,
	Address,
	NonPayableCallOptions,
	PayableCallOptions,
	ContractInitOptions,
} from '@theqrl/web3-types';
import { isNullish, mergeDeep } from '@theqrl/web3-utils';
import { encodeMethodABI } from './encoding.js';
import { ContractOptions, Web3ContractContext } from './types.js';

const dataInputEncodeMethodHelper = (
	txParams: TransactionCall | TransactionForAccessList,
	abi: AbiFunctionFragment,
	params: unknown[],
	dataInputFill?: 'data' | 'input' | 'both',
): { data?: HexString; input?: HexString } => {
	const tx: { data?: HexString; input?: HexString } = {};
	if (!isNullish(txParams.data) || dataInputFill === 'both') {
		tx.data = encodeMethodABI(abi, params, (txParams.data ?? txParams.input) as HexString);
	}
	if (!isNullish(txParams.input) || dataInputFill === 'both') {
		tx.input = encodeMethodABI(abi, params, (txParams.input ?? txParams.data) as HexString);
	}
	// if input and data is empty, use web3config default
	if (isNullish(tx.input) && isNullish(tx.data)) {
		tx[dataInputFill as 'data' | 'input'] = encodeMethodABI(abi, params);
	}

	return { data: tx.data as HexString, input: tx.input as HexString };
};

export const getSendTxParams = ({
	abi,
	params,
	options,
	contractOptions,
}: {
	abi: AbiFunctionFragment;
	params: unknown[];
	options?: (PayableCallOptions | NonPayableCallOptions) & {
		input?: HexString;
		data?: HexString;
		to?: Address;
		dataInputFill?: 'input' | 'data' | 'both';
	};
	contractOptions: ContractOptions;
}): TransactionCall => {
	const deploymentCall =
		options?.input ?? options?.data ?? contractOptions.input ?? contractOptions.data;
	if (!deploymentCall && !options?.to && !contractOptions.address) {
		throw new Web3ContractError('Contract address not specified');
	}

	if (!options?.from && !contractOptions.from) {
		throw new Web3ContractError('Contract "from" address not specified');
	}
	let txParams = mergeDeep(
		{
			to: contractOptions.address,
			gas: contractOptions.gas,
			from: contractOptions.from,
			input: contractOptions.input,
			maxPriorityFeePerGas: contractOptions.maxPriorityFeePerGas,
			maxFeePerGas: contractOptions.maxFeePerGas,
			data: contractOptions.data,
		},
		options as unknown as Record<string, unknown>,
	) as unknown as TransactionCall;
	const dataInput = dataInputEncodeMethodHelper(txParams, abi, params, options?.dataInputFill);
	txParams = { ...txParams, data: dataInput.data, input: dataInput.input };

	return txParams;
};

export const getZondTxCallParams = ({
	abi,
	params,
	options,
	contractOptions,
}: {
	abi: AbiFunctionFragment;
	params: unknown[];
	options?: (PayableCallOptions | NonPayableCallOptions) & {
		to?: Address;
		dataInputFill?: 'input' | 'data' | 'both';
	};
	contractOptions: ContractOptions;
}): TransactionCall => {
	if (!options?.to && !contractOptions.address) {
		throw new Web3ContractError('Contract address not specified');
	}
	let txParams = mergeDeep(
		{
			to: contractOptions.address,
			gas: contractOptions.gas,
			from: contractOptions.from,
			input: contractOptions.input,
			maxPriorityFeePerGas: contractOptions.maxPriorityFeePerGas,
			maxFeePerGas: contractOptions.maxFeePerGas,
			data: contractOptions.data,
		},
		options as unknown as Record<string, unknown>,
	) as unknown as TransactionCall;

	const dataInput = dataInputEncodeMethodHelper(txParams, abi, params, options?.dataInputFill);
	txParams = { ...txParams, data: dataInput.data, input: dataInput.input };

	return txParams;
};

export const getEstimateGasParams = ({
	abi,
	params,
	options,
	contractOptions,
}: {
	abi: AbiFunctionFragment;
	params: unknown[];
	options?: (PayableCallOptions | NonPayableCallOptions) & {
		dataInputFill?: 'input' | 'data' | 'both';
	};
	contractOptions: ContractOptions;
}): Partial<TransactionWithSenderAPI> => {
	let txParams = mergeDeep(
		{
			to: contractOptions.address,
			gas: contractOptions.gas,
			maxFeePerGas: contractOptions.maxFeePerGas,
			maxPriorityFeePerGas: contractOptions.maxPriorityFeePerGas,
			from: contractOptions.from,
			input: contractOptions.input,
			data: contractOptions.data,
		},
		options as unknown as Record<string, unknown>,
	) as unknown as TransactionCall;

	const dataInput = dataInputEncodeMethodHelper(txParams, abi, params, options?.dataInputFill);
	txParams = { ...txParams, data: dataInput.data, input: dataInput.input };

	return txParams as TransactionWithSenderAPI;
};

export const isContractInitOptions = (options: unknown): options is ContractInitOptions =>
	typeof options === 'object' &&
	!isNullish(options) &&
	[
		'input',
		'data',
		'from',
		'gas',
		'maxFeePerGas',
		'maxPriorityFeePerGas',
		'gasLimit',
		'address',
		'jsonInterface',
		'syncWithContext',
		'dataInputFill',
	].some(key => key in options);

export const isWeb3ContractContext = (options: unknown): options is Web3ContractContext =>
	typeof options === 'object' && !isNullish(options) && !isContractInitOptions(options);

export const getCreateAccessListParams = ({
	abi,
	params,
	options,
	contractOptions,
}: {
	abi: AbiFunctionFragment;
	params: unknown[];
	options?: (PayableCallOptions | NonPayableCallOptions) & {
		to?: Address;
		dataInputFill?: 'input' | 'data' | 'both';
	};
	contractOptions: ContractOptions;
}): TransactionForAccessList => {
	if (!options?.to && !contractOptions.address) {
		throw new Web3ContractError('Contract address not specified');
	}

	if (!options?.from && !contractOptions.from) {
		throw new Web3ContractError('Contract "from" address not specified');
	}

	let txParams = mergeDeep(
		{
			to: contractOptions.address,
			gas: contractOptions.gas,
			from: contractOptions.from,
			input: contractOptions.input,
			maxPriorityFeePerGas: contractOptions.maxPriorityFeePerGas,
			maxFeePerGas: contractOptions.maxFeePerGas,
			data: contractOptions.data,
		},
		options as unknown as Record<string, unknown>,
	) as unknown as TransactionForAccessList;

	const dataInput = dataInputEncodeMethodHelper(txParams, abi, params, options?.dataInputFill);
	txParams = { ...txParams, data: dataInput.data, input: dataInput.input };

	return txParams;
};
