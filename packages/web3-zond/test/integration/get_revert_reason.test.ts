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

/* eslint-disable jest/no-conditional-expect */

import { Address, Transaction, TransactionCall } from '@theqrl/web3-types';

import Web3Zond from '../../src';
import { getRevertReason } from '../../src/utils/get_revert_reason';
import { SimpleRevertAbi, SimpleRevertDeploymentData } from '../fixtures/simple_revert';
import {
	createTempAccount,
	getSystemTestBackend,
	getSystemTestProvider,
} from '../fixtures/system_test_utils';

describe('Web3Zond.getRevertReason', () => {
	let tempAccount: { address: string; seed: string };
	let web3Zond: Web3Zond;
	let simpleRevertContractAddress: Address;

	beforeAll(async () => {
		tempAccount = await createTempAccount();
		web3Zond = new Web3Zond(getSystemTestProvider());

		const simpleRevertDeployTransaction: Transaction = {
			from: tempAccount.address,
			data: SimpleRevertDeploymentData,
			type: BigInt(2),
		};
		simpleRevertDeployTransaction.gas = await web3Zond.estimateGas(
			simpleRevertDeployTransaction,
		);
		simpleRevertContractAddress = (
			await web3Zond.sendTransaction(simpleRevertDeployTransaction)
		).contractAddress as Address;
	});

	it('should return reason for a contract call', async () => {
		const transaction: TransactionCall = {
			from: tempAccount.address,
			to: simpleRevertContractAddress,
			data: '0xf38fb65b',
			type: BigInt(2),
		};

		const response = await getRevertReason(web3Zond, transaction);

		switch (getSystemTestBackend()) {
			case 'gzond':
				expect(response).toMatchObject({
					reason: 'execution reverted: This is a call revert',
					signature: '0x08c379a0',
					data: '000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000155468697320697320612063616c6c207265766572740000000000000000000000',
				});
				break;
			default:
				throw new Error(
					`Unable to finish test, unknown backend: ${getSystemTestBackend()}`,
				);
		}
	});

	it('should return reason for a contract send', async () => {
		const transaction: TransactionCall = {
			from: tempAccount.address,
			to: simpleRevertContractAddress,
			data: '0xba57a511000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000067265766572740000000000000000000000000000000000000000000000000000',
		};

		const response = await getRevertReason(web3Zond, transaction);

		switch (getSystemTestBackend()) {
			case 'gzond':
				expect(response).toMatchObject({
					reason: 'execution reverted: This is a send revert',
					signature: '0x08c379a0',
					data: '000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000155468697320697320612073656e64207265766572740000000000000000000000',
				});
				break;
			default:
				throw new Error(
					`Unable to finish test, unknown backend: ${getSystemTestBackend()}`,
				);
		}
	});

	it('should return out of gas reason', async () => {
		const transaction: TransactionCall = {
			from: tempAccount.address,
			to: simpleRevertContractAddress,
			type: BigInt(2),
			gas: '0x0',
			data: '0xba57a511000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000067265766572740000000000000000000000000000000000000000000000000000',
		};

		const response = await getRevertReason(web3Zond, transaction);
		switch (getSystemTestBackend()) {
			case 'gzond':
				expect(response).toBe(
					'err: intrinsic gas too low: have 0, want 21544 (supplied gas 0)',
				);
				break;
			default:
				throw new Error(
					`Unable to finish test, unknown backend: ${getSystemTestBackend()}`,
				);
		}
	});

	it('should revert with custom error with no params', async () => {
		const transaction: TransactionCall = {
			from: tempAccount.address,
			to: simpleRevertContractAddress,
			data: '0x3ebf4d9c',
			type: BigInt(2),
		};

		const response = await getRevertReason(web3Zond, transaction, SimpleRevertAbi);
		switch (getSystemTestBackend()) {
			case 'gzond':
				expect(response).toMatchObject({
					data: '',
					reason: 'execution reverted',
					signature: '0x72090e4d',
					customErrorName: 'ErrorWithNoParams',
					customErrorDecodedSignature: 'ErrorWithNoParams()',
					customErrorArguments: {},
				});
				break;
			default:
				throw new Error(
					`Unable to finish test, unknown backend: ${getSystemTestBackend()}`,
				);
		}
	});

	it('should revert with custom error with params', async () => {
		const transaction: TransactionCall = {
			from: tempAccount.address,
			to: simpleRevertContractAddress,
			data: '0x819f48fe',
			type: BigInt(2),
		};

		const response = await getRevertReason(web3Zond, transaction, SimpleRevertAbi);
		switch (getSystemTestBackend()) {
			case 'gzond':
				expect(response).toMatchObject({
					data: '000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001c5468697320697320616e206572726f72207769746820706172616d7300000000',
					reason: 'execution reverted',
					signature: '0xc85bda60',
					customErrorName: 'ErrorWithParams',
					customErrorDecodedSignature: 'ErrorWithParams(uint256,string)',
					customErrorArguments: {
						code: BigInt(42),
						message: 'This is an error with params',
					},
				});
				break;
			default:
				throw new Error(
					`Unable to finish test, unknown backend: ${getSystemTestBackend()}`,
				);
		}
	});

	it("shouldn't return a revert reason", async () => {
		const transaction: TransactionCall = {
			from: tempAccount.address,
			to: simpleRevertContractAddress,
			data: '0xba57a51100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
			type: BigInt(2),
		};

		const response = await getRevertReason(web3Zond, transaction);
		expect(response).toBeUndefined();
	});
});
