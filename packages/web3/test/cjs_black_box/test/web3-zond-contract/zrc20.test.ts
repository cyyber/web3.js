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
import Contract from '@theqrl/web3-zond-contract';
import {
	closeOpenConnection,
	describeIf,
	getSystemTestBackend,
	isWs,
	getSystemTestProvider,
	createNewAccount,
	// eslint-disable-next-line import/no-relative-packages
} from '../../../shared_fixtures/system_tests_utils';
import {
	ZRC20TokenAbi,
	ZRC20TokenBytecode,
	// eslint-disable-next-line import/no-relative-packages
} from '../../../shared_fixtures/contracts/ZRC20Token';
/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const Web3 = require('@theqrl/web3').default;

describeIf(getSystemTestBackend() === 'gzond')('Black Box Unit Tests - web3.zond.Contract', () => {
	describe('Gzond - ZRC20', () => {
		let account;
		let web3: typeof Web3;
		let deployedContract: Contract<typeof ZRC20TokenAbi>;

		beforeAll(async () => {
			account = await createNewAccount({
				refill: true,
			});

			web3 = new Web3(getSystemTestProvider());
			deployedContract = await new web3.zond.Contract(ZRC20TokenAbi)
				.deploy({
					data: ZRC20TokenBytecode,
					arguments: ['420'],
				})
				.send({ from: account.address, gas: '10000000' });
		});

		afterAll(async () => {
			if (isWs) await closeOpenConnection(web3);
		});

		it('should get deployed contract info', async () => {
			const contract = new web3.zond.Contract(
				ZRC20TokenAbi,
				deployedContract.options.address,
			);

			expect(await contract.methods.name().call()).toBe('Gold');
			expect(await contract.methods.symbol().call()).toBe('GLD');
			expect(await contract.methods.decimals().call()).toBe(BigInt(18));
			expect(await contract.methods.totalSupply().call()).toBe(BigInt(420));
		});
	});
});
