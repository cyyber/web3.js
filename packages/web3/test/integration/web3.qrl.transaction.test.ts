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

import * as httpProvider from '@theqrl/web3-providers-http';
import { recoverTransaction, TransactionFactory, Web3Account } from '@theqrl/web3-qrl-accounts';
import { hexToBytes, toChecksumAddress } from '@theqrl/web3-utils';
import Web3, { DEFAULT_RETURN_FORMAT, Transaction } from '../../src';
// TODO(youtrack/theqrl/web3.js/8)
import testsData from '../fixtures/transactions.json';

jest.mock('@theqrl/web3-providers-http');

describe('signTransaction', () => {
	let blockNum = 1;

	it.each(testsData)(
		'Integration test of transaction %s with Web3, Web3.QRL, Web3.Accounts and Provider should pass',
		async txObj => {
			const web3: Web3 = new Web3('http://127.0.0.1:8080');

			const account: Web3Account = web3.qrl.accounts.seedToAccount(txObj.seed);

			web3.qrl.wallet?.add(txObj.seed);
			let sentRawTransaction: unknown;

			const normalTx: Transaction = {
				...txObj.transaction,
				from: account.address,
			};

			jest.spyOn(httpProvider.HttpProvider.prototype, 'request').mockImplementation(
				async (payload: any) => {
					const response = {
						jsonrpc: '2.0',
						id: payload.id,
						result: {},
					};

					switch (payload.method) {
						case 'net_version':
							response.result = '1';
							break;

						case 'qrl_chainId':
							response.result = '0x1';
							break;

						case 'qrl_blockNumber':
							blockNum += 10;
							response.result = `0x${blockNum.toString(16)}`;
							break;

						case 'qrl_getTransactionReceipt':
							response.result = {
								blockHash:
									'0xa957d47df264a31badc3ae823e10ac1d444b098d9b73d204c40426e57f47e8c3',
								blockNumber: `0x${blockNum.toString(16)}`,
								cumulativeGasUsed: '0xa12515',
								from: payload.from,
								gasUsed: payload.gasLimit,
								status: '0x1',
								to: payload.to,
								transactionHash:
									'0x85d995eba9763907fdf35cd2034144dd9d53ce32cbec21349d4b12823c6860c5',
								transactionIndex: '0x66',
							};
							break;

						case 'qrl_sendRawTransaction':
							[sentRawTransaction] = payload.params;
							response.result =
								'0x895ebb29d30e0afa891a5ca3a2687e073bd2c7ab544117ac386c8d8ff3ad583b';
							break;

						default:
							throw new Error(`Unknown payload ${JSON.stringify(payload)}`);
					}

					return new Promise(resolve => {
						resolve(response as any);
					});
				},
			);

			const res = await web3.qrl.sendTransaction(normalTx, DEFAULT_RETURN_FORMAT, {
				ignoreGasPricing: true,
				checkRevertBeforeSending: false,
			});
			expect(res).toBeDefined();

			// ML-DSA signatures are nondeterministic, so compare decoded fields,
			// the recovered sender, and signature presence instead of raw bytes.
			expect(typeof sentRawTransaction).toBe('string');
			expect(sentRawTransaction).toMatch(/^0x02/);

			const raw = sentRawTransaction as string;
			const decoded = TransactionFactory.fromSerializedData(hexToBytes(raw));
			const json = decoded.toJSON();

			expect(decoded.verifySignature()).toBe(true);
			expect(recoverTransaction(raw)).toBe(account.address);
			expect(decoded.type).toBe(2);
			expect(BigInt(json.chainId ?? 0)).toBe(BigInt(txObj.transaction.chainId));
			expect(BigInt(json.nonce ?? 0)).toBe(BigInt(txObj.transaction.nonce));
			expect(BigInt(json.gasLimit ?? 0)).toBe(BigInt(txObj.transaction.gasLimit));
			expect(BigInt(json.maxFeePerGas ?? 0)).toBe(BigInt(txObj.transaction.maxFeePerGas));
			expect(BigInt(json.maxPriorityFeePerGas ?? 0)).toBe(
				BigInt(txObj.transaction.maxPriorityFeePerGas),
			);
			expect(BigInt(json.value ?? 0)).toBe(BigInt(txObj.transaction.value));
			expect(json.data).toBe(txObj.transaction.data);
			expect(toChecksumAddress(json.to as string)).toBe(
				toChecksumAddress(txObj.transaction.to),
			);
			expect(json.accessList).toHaveLength(txObj.transaction.accessList.length);
			json.accessList?.forEach((item, index) => {
				const expected = txObj.transaction.accessList[index];
				expect(item.address.slice(-128).toLowerCase()).toBe(
					expected.address.slice(-128).toLowerCase(),
				);
				expect(item.storageKeys).toEqual(expected.storageKeys);
			});
			expect(json.signature).toMatch(/^0x/);
			expect(json.publicKey).toMatch(/^0x/);
		},
	);
});
