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

import Web3QRL from '../../src/index';
import * as rpcMethodWrappers from '../../src/rpc_method_wrappers';
import {
	getBlockNumberValidData,
	getChainIdValidData,
	getGasPriceValidData,
} from '../fixtures/rpc_methods_wrappers';
import {
	estimateGasValidData,
	getBalanceValidData,
	getBlockTransactionCountValidData,
	getBlockValidData,
	getCodeValidData,
	getFeeHistoryValidData,
	getPastLogsValidData,
	getProofValidData,
	getStorageAtValidData,
	getTransactionCountValidData,
	getTransactionFromBlockValidData,
	getTransactionReceiptValidData,
	getTransactionValidData,
	sendSignedTransactionValidData,
	signValidData,
	tx,
	txReceipt,
} from '../fixtures/web3_qrl_methods_with_parameters';

import { testData as createAccessListTestData } from './rpc_method_wrappers/fixtures/createAccessList';

jest.mock('@theqrl/web3-rpc-methods');
jest.mock('../../src/rpc_method_wrappers');
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
jest.spyOn(rpcMethodWrappers, 'getTransaction').mockResolvedValue(tx);
jest.spyOn(rpcMethodWrappers, 'getTransactionReceipt').mockResolvedValue(txReceipt);

describe('web3_qrl_methods_with_parameters', () => {
	let web3QRL: Web3QRL;

	beforeAll(() => {
		web3QRL = new Web3QRL('http://127.0.0.1:8545');
	});

	describe('should call RPC method with expected parameters', () => {
		describe('only has returnFormat parameter', () => {
			describe('getGasPrice', () => {
				it.each(getGasPriceValidData)('returnFormat: %s', async returnFormat => {
					await web3QRL.getGasPrice(returnFormat);
					expect(rpcMethodWrappers.getGasPrice).toHaveBeenCalledWith(
						web3QRL,
						returnFormat,
					);
				});
			});

			describe('getBlockNumber', () => {
				it.each(getBlockNumberValidData)('returnFormat: %s', async returnFormat => {
					await web3QRL.getBlockNumber(returnFormat);
					expect(rpcMethodWrappers.getBlockNumber).toHaveBeenCalledWith(
						web3QRL,
						returnFormat,
					);
				});
			});

			describe('getChainId', () => {
				it.each(getChainIdValidData)('returnFormat: %s', async returnFormat => {
					await web3QRL.getChainId(returnFormat);
					expect(rpcMethodWrappers.getChainId).toHaveBeenCalledWith(
						web3QRL,
						returnFormat,
					);
				});
			});
		});

		describe('has multiple parameters', () => {
			describe('has returnFormat parameter', () => {
				describe('getBalance', () => {
					it.each(getBalanceValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getBalance(...input);
							expect(rpcMethodWrappers.getBalance).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getBlock', () => {
					it.each(getBlockValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getBlock(...input);
							expect(rpcMethodWrappers.getBlock).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getBlockTransactionCount', () => {
					it.each(getBlockTransactionCountValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getBlockTransactionCount(...input);
							expect(rpcMethodWrappers.getBlockTransactionCount).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getTransaction', () => {
					it.each(getTransactionValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getTransaction(...input);
							expect(rpcMethodWrappers.getTransaction).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getTransactionFromBlock', () => {
					it.each(getTransactionFromBlockValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getTransactionFromBlock(...input);
							expect(rpcMethodWrappers.getTransactionFromBlock).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getTransactionReceipt', () => {
					it.each(getTransactionReceiptValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getTransactionReceipt(...input);
							expect(rpcMethodWrappers.getTransactionReceipt).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getTransactionCount', () => {
					it.each(getTransactionCountValidData)(
						'input: %s\rpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getTransactionCount(...input);
							expect(rpcMethodWrappers.getTransactionCount).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('estimateGas', () => {
					it.each(estimateGasValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.estimateGas(...input);
							expect(rpcMethodWrappers.estimateGas).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getFeeHistory', () => {
					it.each(getFeeHistoryValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getFeeHistory(...input);
							expect(rpcMethodWrappers.getFeeHistory).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getProof', () => {
					it.each(getProofValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getProof(...input);
							expect(rpcMethodWrappers.getProof).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getStorageAt', () => {
					it.each(getStorageAtValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getStorageAt(...input);
							expect(rpcMethodWrappers.getStorageAt).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getCode', () => {
					it.each(getCodeValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getCode(...input);
							expect(rpcMethodWrappers.getCode).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('sendSignedTransaction', () => {
					it.each(sendSignedTransactionValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.sendSignedTransaction(...input);
							expect(rpcMethodWrappers.sendSignedTransaction).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('sign', () => {
					it.each(signValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.sign(...input);
							expect(rpcMethodWrappers.sign).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('getPastLogs', () => {
					it.each(getPastLogsValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (input, rpcMethodParameters) => {
							await web3QRL.getPastLogs(...input);
							expect(rpcMethodWrappers.getLogs).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});
				describe('getPastLogs called with rpcMethodWrappers', () => {
					it.each(getPastLogsValidData)(
						'input: %s\nrpcMethodParameters: %s',
						async (_, rpcMethodParameters) => {
							await rpcMethodWrappers.getLogs(web3QRL, ...rpcMethodParameters);
							expect(rpcMethodWrappers.getLogs).toHaveBeenCalledWith(
								web3QRL,
								...rpcMethodParameters,
							);
						},
					);
				});

				describe('createAccessList', () => {
					it.each(createAccessListTestData)(
						'input: %s\nrpcMethodParameters: %s',
						async (_, input) => {
							await web3QRL.createAccessList(...input);
							expect(rpcMethodWrappers.createAccessList).toHaveBeenCalledWith(
								web3QRL,
								...input,
							);
						},
					);
				});
			});
		});
	});
});
