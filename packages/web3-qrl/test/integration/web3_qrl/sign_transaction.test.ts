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

import { Transaction } from '@theqrl/web3-types';
import { toChecksumAddress } from '@theqrl/web3-utils';
import { Web3QRL } from '../../../src';
import {
	closeOpenConnection,
	createTempAccount,
	getSystemTestProvider,
} from '../../fixtures/system_test_utils';
import { GREETER_DEPLOYMENT_DATA } from '../../fixtures/greeter';

describe('Web3QRL.signTransaction', () => {
	let web3QRL: Web3QRL;
	let tempAcc: { address: string; seed: string };

	beforeAll(async () => {
		web3QRL = new Web3QRL(getSystemTestProvider());
		tempAcc = await createTempAccount();
	});

	afterAll(async () => {
		await closeOpenConnection(web3QRL);
	});

	it('should sign a simple value transfer', async () => {
		const nonce = await web3QRL.getTransactionCount(tempAcc.address);
		const transaction: Transaction = {
			from: tempAcc.address,
			nonce,
			to: tempAcc.address,
			value: '0x1',
			type: BigInt(2),
			gas: 21000,
			maxFeePerGas: BigInt(108571383800),
			maxPriorityFeePerGas: BigInt(25415778028),
		};
		const response = await web3QRL.signTransaction(transaction);
		const expectedResponse: { tx: Transaction } = {
			tx: {
				type: BigInt(2),
				nonce: BigInt(nonce),
				maxFeePerGas: BigInt(108571383800),
				maxPriorityFeePerGas: BigInt(25415778028),
				gas: BigInt(21000),
				value: BigInt(1),
				to: toChecksumAddress(tempAcc.address),
				input: '0x',
				data: '0x',
			},
		};

		expect(response).toMatchObject(expectedResponse);

		// Pulling out of toMatchObject to be compatiable with Cypress
		expect(response.raw).toMatch(/0[xX][0-9a-fA-F]+/);
		expect(response.tx.descriptor).toMatch(/0[xX][0-9a-fA-F]{6}/);
		expect(response.tx.extraParams).toMatch(/0[xX][0-9a-fA-F]{0}/);
		expect(response.tx.signature).toMatch(/0[xX][0-9a-fA-F]{64}/);
		expect(response.tx.publicKey).toMatch(/0[xX][0-9a-fA-F]{64}/);
	});

	it('should sign a contract deployment', async () => {
		const nonce = await web3QRL.getTransactionCount(tempAcc.address);
		const transaction: Transaction = {
			from: tempAcc.address,
			nonce,
			data: GREETER_DEPLOYMENT_DATA,
			type: BigInt(2),
			gas: 700000,
			maxFeePerGas: BigInt(108571383800),
			maxPriorityFeePerGas: BigInt(25415778028),
		};
		const response = await web3QRL.signTransaction(transaction);
		const expectedResponse: { tx: Transaction } = {
			tx: {
				type: BigInt(2),
				nonce: BigInt(nonce),
				gas: BigInt(700000),
				input: GREETER_DEPLOYMENT_DATA,
				data: GREETER_DEPLOYMENT_DATA,
				maxFeePerGas: BigInt(108571383800),
				maxPriorityFeePerGas: BigInt(25415778028),
			},
		};

		// eslint-disable-next-line jest/no-standalone-expect
		expect(response).toMatchObject(expectedResponse);
		// Pulling out of toMatchObject to be compatiable with Cypress
		expect(response.raw).toMatch(/0[xX][0-9a-fA-F]+/);
		expect(response.tx.descriptor).toMatch(/0[xX][0-9a-fA-F]{6}/);
		expect(response.tx.extraParams).toMatch(/0[xX][0-9a-fA-F]{0}/);
		expect(response.tx.signature).toMatch(/0[xX][0-9a-fA-F]{64}/);
		expect(response.tx.publicKey).toMatch(/0[xX][0-9a-fA-F]{64}/);
	});
});
