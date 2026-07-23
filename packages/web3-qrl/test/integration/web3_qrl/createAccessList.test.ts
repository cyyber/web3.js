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

import { AccessListResult, Transaction, TransactionForAccessList } from '@theqrl/web3-types';
import { Web3QRL } from '../../../src';
import {
	closeOpenConnection,
	createTempAccount,
	describeIf,
	getSystemTestBackend,
	getSystemTestProvider,
} from '../../fixtures/system_test_utils';
import { GREETER_DEPLOYMENT_DATA } from '../../fixtures/greeter';

describeIf(getSystemTestBackend() === 'gqrl')('Web3QRL.createAccessList', () => {
	let web3QRL: Web3QRL;
	let greeterContractAddress: string;
	let tempAcc: { address: string; seed: string };

	beforeAll(async () => {
		web3QRL = new Web3QRL(getSystemTestProvider());
		tempAcc = await createTempAccount();
		const transaction: Transaction = {
			from: tempAcc.address,
			data: GREETER_DEPLOYMENT_DATA,
			type: BigInt(2),
		};
		const response = await web3QRL.sendTransaction(transaction);
		greeterContractAddress = response.contractAddress as string;
	});

	afterAll(async () => {
		await closeOpenConnection(web3QRL);
	});

	test('should return access list for provided transaction', async () => {
		const transaction: TransactionForAccessList = {
			from: tempAcc.address,
			to: greeterContractAddress,
			data: '0xcfae3217', // greet function call data encoded
		};

		const response = await web3QRL.createAccessList(transaction);

		const expectedResponse: AccessListResult = {
			accessList: [
				{
					address: greeterContractAddress,
					storageKeys: [
						'0x0000000000000000000000000000000000000000000000000000000000000001',
					],
				},
			],
			gasUsed: '0x731e',
		};

		expect(response).toStrictEqual(expectedResponse);
	});
});
