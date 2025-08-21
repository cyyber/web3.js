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
/* eslint-disable import/no-relative-packages */
import Web3 from '@theqrl/web3';
import Contract from '@theqrl/web3-qrl-contract';

import {
	closeOpenConnection,
	describeIf,
	getSystemTestBackend,
	isWs,
	getSystemTestProvider,
	createNewAccount,
} from '../../../shared_fixtures/system_tests_utils';
import { SQRCTF1TokenAbi, SQRCTF1TokenBytecode } from '../../../shared_fixtures/contracts/SQRCTF1Token';

describeIf(getSystemTestBackend() === 'gzond')('Black Box Unit Tests - web3.qrl.Contract', () => {
	describe('Gzond - SQRCTF1', () => {
		let account;
		let web3: Web3;
		let deployedContract: Contract<typeof SQRCTF1TokenAbi>;

		beforeAll(async () => {
			account = await createNewAccount({
				refill: true,
			});

			web3 = new Web3(getSystemTestProvider());
			deployedContract = await new web3.qrl.Contract(SQRCTF1TokenAbi)
				.deploy({
					data: SQRCTF1TokenBytecode,
					arguments: ['420'],
				})
				.send({ from: account.address, gas: '10000000' });
		});

		afterAll(async () => {
			if (isWs) await closeOpenConnection(web3);
		});

		it('should get deployed contract info', async () => {
			const contract = new web3.qrl.Contract(
				SQRCTF1TokenAbi,
				deployedContract.options.address,
			);

			expect(await contract.methods.name().call()).toBe('Gold');
			expect(await contract.methods.symbol().call()).toBe('GLD');
			expect(await contract.methods.decimals().call()).toBe(BigInt(18));
			expect(await contract.methods.totalSupply().call()).toBe(BigInt(420));
		});
	});
});
