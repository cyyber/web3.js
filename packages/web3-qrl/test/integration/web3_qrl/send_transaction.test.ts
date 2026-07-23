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

// TODO Seems to be an issue with linter falsely reporting this
// error for Transaction Error Scenarios tests
/* eslint-disable jest/no-conditional-expect */

import {
	Transaction,
	TransactionWithFromLocalWalletIndex,
	TransactionWithToLocalWalletIndex,
	TransactionWithFromAndToLocalWalletIndex,
	Address,
	DEFAULT_RETURN_FORMAT,
} from '@theqrl/web3-types';
import { Wallet } from '@theqrl/web3-qrl-accounts';
import { isHexStrict } from '@theqrl/web3-validator';

import Web3QRL from '../../../src';
import {
	closeOpenConnection,
	createAccountProvider,
	createTempAccount,
	getSystemTestBackend,
	getSystemTestProvider,
} from '../../fixtures/system_test_utils';
import { GREETER_DEPLOYMENT_DATA, GREETER_SET_GREETING_42_DATA } from '../../fixtures/greeter';
import {
	encodeSimpleRevertSend,
	SIMPLE_REVERT_CUSTOM_ERROR_DATA,
	SIMPLE_REVERT_SEND_REASON_DATA,
	SimpleRevertAbi,
	SimpleRevertDeploymentData,
} from '../../fixtures/simple_revert';

describe('Web3QRL.sendTransaction', () => {
	let web3QRL: Web3QRL;
	let tempAcc: { address: string; seed: string };

	beforeAll(async () => {
		web3QRL = new Web3QRL(getSystemTestProvider());
		tempAcc = await createTempAccount();
	});

	afterAll(async () => {
		await closeOpenConnection(web3QRL);
	});

	it('should make a simple value transfer', async () => {
		const transaction: Transaction = {
			from: tempAcc.address,
			to: tempAcc.address,
			value: BigInt(1),
			type: BigInt(2),
		};
		const response = await web3QRL.sendTransaction(transaction);
		expect(response.status).toBe(BigInt(1));

		const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
		expect(minedTransactionData).toMatchObject(transaction);
	});

	it('should make a simple value transfer - with local wallet indexed sender', async () => {
		const web3EthWithWallet = new Web3QRL(getSystemTestProvider());
		const accountProvider = createAccountProvider(web3QRL);
		const wallet = new Wallet(accountProvider);

		web3EthWithWallet['_accountProvider'] = accountProvider;
		web3EthWithWallet['_wallet'] = wallet;

		web3EthWithWallet.wallet?.add(tempAcc.seed);

		const transaction: TransactionWithFromLocalWalletIndex = {
			from: 0,
			to: tempAcc.address,
			type: BigInt(2),
			value: BigInt(1),
		};
		const response = await web3EthWithWallet.sendTransaction(transaction);
		expect(response.status).toBe(BigInt(1));

		const minedTransactionData = await web3EthWithWallet.getTransaction(
			response.transactionHash,
		);

		expect(minedTransactionData).toMatchObject({
			from: tempAcc.address,
			to: tempAcc.address,
			value: BigInt(1),
		});
	});

	it('should make a simple value transfer - with local wallet indexed receiver', async () => {
		const web3EthWithWallet = new Web3QRL(getSystemTestProvider());
		const accountProvider = createAccountProvider(web3QRL);
		const wallet = new Wallet(accountProvider);

		web3EthWithWallet['_accountProvider'] = accountProvider;
		web3EthWithWallet['_wallet'] = wallet;

		web3EthWithWallet.wallet?.add(tempAcc.seed);

		const transaction: TransactionWithToLocalWalletIndex = {
			from: tempAcc.address,
			to: 0,
			type: BigInt(2),
			value: BigInt(1),
		};
		const response = await web3EthWithWallet.sendTransaction(transaction);
		expect(response.status).toBe(BigInt(1));

		const minedTransactionData = await web3EthWithWallet.getTransaction(
			response.transactionHash,
		);

		const acc = wallet.get(0);
		expect(minedTransactionData).toMatchObject({
			from: tempAcc.address,
			to: acc?.address,
			value: BigInt(1),
		});
	});

	it('should make a simple value transfer - with local wallet indexed sender and receiver', async () => {
		const web3EthWithWallet = new Web3QRL(getSystemTestProvider());
		const accountProvider = createAccountProvider(web3QRL);
		const wallet = new Wallet(accountProvider);

		web3EthWithWallet['_accountProvider'] = accountProvider;
		web3EthWithWallet['_wallet'] = wallet;

		const tempAcc2 = await createTempAccount();

		web3EthWithWallet.wallet?.add(tempAcc.seed);

		web3EthWithWallet.wallet?.add(tempAcc2.seed);

		const transaction: TransactionWithFromAndToLocalWalletIndex = {
			from: 0,
			to: 1,
			type: BigInt(2),
			value: BigInt(1),
		};
		const response = await web3EthWithWallet.sendTransaction(transaction);
		expect(response.status).toBe(BigInt(1));

		const minedTransactionData = await web3EthWithWallet.getTransaction(
			response.transactionHash,
		);

		const acc = wallet.get(1);
		expect(minedTransactionData).toMatchObject({
			from: tempAcc.address,
			to: acc?.address,
			value: BigInt(1),
		});
	});
	it('should make a transaction with no value transfer', async () => {
		const transaction: Transaction = {
			from: tempAcc.address,
			to: tempAcc.address,
			value: BigInt(0),
			type: BigInt(2),
		};
		const response = await web3QRL.sendTransaction(transaction);
		expect(response.status).toBe(BigInt(1));

		const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
		expect(minedTransactionData).toMatchObject(transaction);
	});
	it('should send a transaction with data', async () => {
		const transaction: Transaction = {
			from: tempAcc.address,
			to: tempAcc.address,
			data: '0x64edfbf0e2c706ba4a09595315c45355a341a576cc17f3a19f43ac1c02f814ee',
			value: BigInt(0),
			type: BigInt(2),
		};
		const response = await web3QRL.sendTransaction(transaction);
		expect(response.status).toBe(BigInt(1));

		const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
		expect(minedTransactionData).toMatchObject(transaction);
	});

	describe('Deploy and interact with contract', () => {
		let greeterContractAddress: string;

		it('should deploy a contract', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				data: GREETER_DEPLOYMENT_DATA,
				input: GREETER_DEPLOYMENT_DATA,
				gas: BigInt(700000),
				type: BigInt(2),
			};
			const response = await web3QRL.sendTransaction(transaction);
			expect(response.status).toBe(BigInt(1));
			expect(response.contractAddress).toBeDefined();

			const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
			expect(minedTransactionData).toMatchObject({
				from: tempAcc.address,
				input: GREETER_DEPLOYMENT_DATA,
				gas: BigInt(700000),
				type: BigInt(2),
			});

			greeterContractAddress = response.contractAddress as string;
		});

		it('should update greet in contract', async () => {
			const contractFunctionCall = GREETER_SET_GREETING_42_DATA;
			const transaction: Transaction = {
				from: tempAcc.address,
				to: greeterContractAddress,
				data: contractFunctionCall,
				input: contractFunctionCall,
				type: BigInt(2),
			};
			const response = await web3QRL.sendTransaction(transaction);
			expect(response.status).toBe(BigInt(1));

			const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
			expect(minedTransactionData).toMatchObject({
				from: tempAcc.address,
				to: greeterContractAddress,
				input: contractFunctionCall,
			});
		});
	});

	describe('Transaction Types', () => {
		it('should send a successful type 0x2 transaction', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: tempAcc.address,
				value: BigInt(1),
				type: BigInt(2),
			};
			const response = await web3QRL.sendTransaction(transaction);
			expect(response.type).toBe(BigInt(2));
			expect(response.status).toBe(BigInt(1));

			const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
			expect(minedTransactionData).toMatchObject(transaction);
		});

		it('should send a successful type 0x2 transaction (fee per gas from: calculateFeeData)', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: tempAcc.address,
				value: BigInt(1),
				type: BigInt(2),
			};

			const feeData = await web3QRL.calculateFeeData();
			transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
			transaction.maxFeePerGas = feeData.maxFeePerGas;

			const response = await web3QRL.sendTransaction(transaction);
			expect(response.type).toBe(BigInt(2));
			expect(response.status).toBe(BigInt(1));

			const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
			expect(minedTransactionData).toMatchObject(transaction);
		});

		it('should send a successful type 0x2 transaction with data', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: tempAcc.address,
				data: '0x64edfbf0e2c706ba4a09595315c45355a341a576cc17f3a19f43ac1c02f814ee',
				value: BigInt(1),
				type: BigInt(2),
			};
			const response = await web3QRL.sendTransaction(transaction, DEFAULT_RETURN_FORMAT);
			expect(response.type).toBe(BigInt(2));
			expect(response.status).toBe(BigInt(1));
			const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
			expect(minedTransactionData).toMatchObject(transaction);
		});
	});
	it('should autofill a successful type 0x2 transaction with only maxFeePerGas passed', async () => {
		const transaction: Transaction = {
			from: tempAcc.address,
			to: tempAcc.address,
			value: BigInt(1),
			maxFeePerGas: BigInt(2500000016),
		};
		const response = await web3QRL.sendTransaction(transaction);
		expect(response.type).toBe(BigInt(2));
		expect(response.status).toBe(BigInt(1));
		const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
		expect(minedTransactionData).toMatchObject(transaction);
	});

	it('should autofill a successful type 0x2 transaction with only maxPriorityFeePerGas passed', async () => {
		const transaction: Transaction = {
			from: tempAcc.address,
			to: tempAcc.address,
			value: BigInt(1),
			maxPriorityFeePerGas: BigInt(100),
		};
		const response = await web3QRL.sendTransaction(transaction);
		expect(response.type).toBe(BigInt(2));
		expect(response.status).toBe(BigInt(1));
		const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
		expect(minedTransactionData).toMatchObject(transaction);
	});

	it('should send type 0x2 transaction with maxPriorityFeePerGas got from await web3QRL.getMaxPriorityFeePerGas()', async () => {
		const transaction: Transaction = {
			from: tempAcc.address,
			to: tempAcc.address,
			value: BigInt(1),
			maxPriorityFeePerGas: await web3QRL.getMaxPriorityFeePerGas(),
		};
		const response = await web3QRL.sendTransaction(transaction);

		// eslint-disable-next-line jest/no-standalone-expect
		expect(response.type).toBe(BigInt(2));
		// eslint-disable-next-line jest/no-standalone-expect
		expect(response.status).toBe(BigInt(1));
		const minedTransactionData = await web3QRL.getTransaction(response.transactionHash);
		// eslint-disable-next-line jest/no-standalone-expect
		expect(minedTransactionData).toMatchObject(transaction);
	});

	describe('Transaction PromiEvents', () => {
		let transaction: Transaction;

		beforeEach(async () => {
			tempAcc = await createTempAccount();
			transaction = {
				from: tempAcc.address,
				to: tempAcc.address,
				value: '0x1',
				type: '0x2',
			};
		});

		it('should listen to the sending event', async () => {
			await web3QRL.sendTransaction(transaction).on('sending', data => {
				expect(data).toMatchObject(transaction);
			});
			expect.assertions(1);
		});

		it('should listen to the sent event', async () => {
			await web3QRL.sendTransaction(transaction).on('sent', data => {
				expect(data).toMatchObject(transaction);
			});
			expect.assertions(1);
		});

		it('should listen to the transactionHash event', async () => {
			await web3QRL.sendTransaction(transaction).on('transactionHash', data => {
				expect(isHexStrict(data)).toBe(true);
			});
			expect.assertions(1);
		});

		it('should listen to the receipt event', async () => {
			const expectedTransactionReceipt = {
				blockHash: expect.any(String),
				logs: [],
				logsBloom:
					'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
				from: transaction.from,
				to: transaction.to,
				transactionHash: expect.any(String),
			};
			await web3QRL.sendTransaction(transaction).on('receipt', data => {
				expect(data).toEqual(expect.objectContaining(expectedTransactionReceipt));

				// To avoid issue with the `objectContaining` and `cypress` had to add
				// these expectations explicitly on each attribute
				expect(typeof data.blockNumber).toBe('bigint');
				expect(typeof data.cumulativeGasUsed).toBe('bigint');
				expect(typeof data.effectiveGasPrice).toBe('bigint');
				expect(typeof data.gasUsed).toBe('bigint');
				expect(typeof data.transactionIndex).toBe('bigint');
				expect(data.status).toBe(BigInt(1));
				expect(data.type).toBe(BigInt(2));
			});
			expect.assertions(8);
		});

		it('should listen to the confirmation event', async () => {
			const expectedTransactionConfirmation = {
				confirmationNumber: expect.any(BigInt),
				receipt: {
					blockHash: expect.any(String),
					blockNumber: expect.any(BigInt),
					cumulativeGasUsed: expect.any(BigInt),
					effectiveGasPrice: expect.any(BigInt),
					gasUsed: expect.any(BigInt),
					logs: [],
					logsBloom:
						'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
					status: BigInt(1),
					from: transaction.from,
					to: transaction.to,
					transactionHash: expect.any(String),
					transactionIndex: BigInt(0),
					type: BigInt(0),
				},
				latestBlockHash: expect.any(String),
			};

			await web3QRL.sendTransaction(transaction).on('confirmation', data => {
				expect(data).toEqual(expect.objectContaining(expectedTransactionConfirmation));
			});

			// TODO Confirmations are dependent on the next block being mined,
			// this is manually triggering the next block to be created since both
			// Some test clients wait for a transaction before mining a block.
			// This should be revisited to implement a better solution.
			await web3QRL.sendTransaction(transaction);

			// TODO: Debug why the assertions are not being called
			// expect.assertions(1);
		});
	});

	describe('Transaction Error Scenarios', () => {
		let simpleRevertContractAddress: Address;

		beforeAll(async () => {
			const simpleRevertDeployTransaction: Transaction = {
				from: tempAcc.address,
				data: SimpleRevertDeploymentData,
				type: BigInt(2),
			};
			simpleRevertDeployTransaction.gas = await web3QRL.estimateGas(
				simpleRevertDeployTransaction,
			);
			simpleRevertContractAddress = (
				await web3QRL.sendTransaction(simpleRevertDeployTransaction)
			).contractAddress as Address;
		});

		it('Should throw TransactionRevertInstructionError because gas too low', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: tempAcc.address,
				value: BigInt(1),
				gas: 1,
				type: BigInt(2),
			};

			const expectedThrownError = {
				name: 'TransactionRevertInstructionError',
				code: 402,
				reason:
					getSystemTestBackend() === 'gqrl'
						? 'err: intrinsic gas too low: have 1, want 21000 (supplied gas 1)'
						: 'VM Exception while processing transaction: out of gas',
			};

			await expect(
				web3QRL
					.sendTransaction(transaction)
					.on('error', error => expect(error).toMatchObject(expectedThrownError)),
			).rejects.toMatchObject(expectedThrownError);
		});

		it('Should throw TransactionRevertInstructionError because insufficient funds', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: tempAcc.address,
				value: BigInt('999999999999999999999999999999999999999999999999999999999'),
				type: BigInt(2),
			};

			const expectedThrownError = {
				name: 'TransactionRevertInstructionError',
				message: 'Transaction has been reverted by the QRVM',
				code: 402,
				reason:
					getSystemTestBackend() === 'gqrl'
						? expect.stringContaining(
								'err: insufficient funds for gas * price + value: address',
						  )
						: 'VM Exception while processing transaction: insufficient balance',
			};

			await expect(
				web3QRL
					.sendTransaction(transaction)
					.on('error', error => expect(error).toMatchObject(expectedThrownError)),
			).rejects.toMatchObject(expectedThrownError);
		});

		it('Should throw TransactionRevertInstructionError because of contract revert and return revert reason', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: simpleRevertContractAddress,
				data: encodeSimpleRevertSend('revert'),
				type: BigInt(2),
			};

			web3QRL.handleRevert = true;

			const expectedThrownError = {
				name: 'TransactionRevertInstructionError',
				code: 402,
				reason:
					getSystemTestBackend() === 'gqrl'
						? 'execution reverted: This is a send revert'
						: 'VM Exception while processing transaction: revert This is a send revert',
				signature: '0x08c379a0',
				data: SIMPLE_REVERT_SEND_REASON_DATA,
				receipt: undefined,
			};

			await expect(
				web3QRL
					.sendTransaction(transaction)
					.on('error', error => expect(error).toMatchObject(expectedThrownError)),
			).rejects.toMatchObject(expectedThrownError);
		});

		it('Should throw TransactionRevertWithCustomError because of contract revert and return custom error ErrorWithNoParams', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: simpleRevertContractAddress,
				data: '0x3ebf4d9c',
				type: BigInt(2),
			};

			web3QRL.handleRevert = true;

			const expectedThrownError = {
				name: 'TransactionRevertWithCustomError',
				code: 438,
				reason:
					getSystemTestBackend() === 'gqrl'
						? 'execution reverted'
						: 'VM Exception while processing transaction: revert',
				signature: '0x72090e4d',
				customErrorName: 'ErrorWithNoParams',
				customErrorDecodedSignature: 'ErrorWithNoParams()',
				customErrorArguments: {},
				receipt: undefined,
			};

			await expect(
				web3QRL
					.sendTransaction(transaction, undefined, { contractAbi: SimpleRevertAbi })
					.on('error', error => expect(error).toMatchObject(expectedThrownError)),
			).rejects.toMatchObject(expectedThrownError);
		});

		it('Should throw TransactionRevertWithCustomError because of contract revert and return custom error ErrorWithParams', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: simpleRevertContractAddress,
				data: '0x819f48fe',
				type: BigInt(2),
			};

			web3QRL.handleRevert = true;

			const expectedThrownError = {
				name: 'TransactionRevertWithCustomError',
				code: 438,
				reason:
					getSystemTestBackend() === 'gqrl'
						? 'execution reverted'
						: 'VM Exception while processing transaction: revert',
				signature: '0xc85bda60',
				data: SIMPLE_REVERT_CUSTOM_ERROR_DATA,
				customErrorName: 'ErrorWithParams',
				customErrorDecodedSignature: 'ErrorWithParams(uint256,string)',
				customErrorArguments: {
					code: BigInt(42),
					message: 'This is an error with params',
				},
				receipt: undefined,
			};

			await expect(
				web3QRL
					.sendTransaction(transaction, undefined, { contractAbi: SimpleRevertAbi })
					.on('error', error => expect(error).toMatchObject(expectedThrownError)),
			).rejects.toMatchObject(expectedThrownError);
		});

		it('Should throw TransactionRevertInstructionError because of contract revert', async () => {
			const transaction: Transaction = {
				from: tempAcc.address,
				to: simpleRevertContractAddress,
				data: encodeSimpleRevertSend('revert'),
				type: BigInt(2),
			};

			web3QRL.handleRevert = false;

			const expectedThrownError = {
				name: 'TransactionRevertInstructionError',
				code: 402,
				reason:
					getSystemTestBackend() === 'gqrl'
						? 'execution reverted: This is a send revert'
						: 'VM Exception while processing transaction: revert This is a send revert',
				signature: '0x08c379a0',
				data: SIMPLE_REVERT_SEND_REASON_DATA,
			};

			await expect(
				web3QRL
					.sendTransaction(transaction)
					.on('error', error => expect(error).toMatchObject(expectedThrownError)),
			).rejects.toMatchObject(expectedThrownError);
		});
	});
});
