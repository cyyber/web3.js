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

// eslint-disable-next-line import/no-extraneous-dependencies
import Web3 from '@theqrl/web3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Web3Account } from '@theqrl/web3-zond-accounts';
import { Contract, EventLog } from '../../../src';
import { ZRC721TokenAbi, ZRC721TokenBytecode } from '../../shared_fixtures/build/ZRC721Token';
import { getSystemTestProvider, createLocalAccount } from '../../fixtures/system_test_utils';
import { toUpperCaseHex } from '../../shared_fixtures/utils';

describe('contract', () => {
	describe('zrc721', () => {
		let contract: Contract<typeof ZRC721TokenAbi>;
		let sendOptions: Record<string, unknown>;
		let deployOptions: Record<string, unknown>;
		let localAccount: Web3Account;
		let web3: Web3;
		let contractDeployed: Contract<typeof ZRC721TokenAbi>;
		beforeAll(async () => {
			web3 = new Web3(getSystemTestProvider());
			localAccount = await createLocalAccount(web3);
			contract = new web3.zond.Contract(ZRC721TokenAbi) as unknown as Contract<
				typeof ZRC721TokenAbi
			>;

			deployOptions = {
				data: ZRC721TokenBytecode,
				arguments: [],
			};

			sendOptions = {
				from: localAccount.address,
				gas: '1000000',
			};
			contractDeployed = await contract
				.deploy(deployOptions)
				.send({ ...sendOptions, gas: '3000000' });
		});

		it('should deploy the contract', () => {
			expect(contractDeployed.options.address).toBeDefined();
		});

		it.each(['0x2'])('should award item %p', async type => {
			const tempAccount = web3.zond.accounts.create();
			await contractDeployed.methods
				.awardItem(tempAccount.address, 'http://my-nft-uri')
				.send({ ...sendOptions, type });

			const logs = await contractDeployed.getPastEvents('Transfer');
			const tokenId = (logs[0] as EventLog)?.returnValues?.tokenId as string;

			expect(
				toUpperCaseHex(
					(await contractDeployed.methods.ownerOf(tokenId).call()) as unknown as string,
				),
			).toBe(toUpperCaseHex(tempAccount.address));
		});

		it.each(['0x2'])('should transferFrom item %p', async type => {
			const tempAccount = await createLocalAccount(web3);
			const toAccount = await createLocalAccount(web3);
			await contractDeployed.methods
				.awardItem(tempAccount.address, 'http://my-nft-award')
				.send({ ...sendOptions, type });

			const logs = await contractDeployed.getPastEvents('Transfer');
			const tokenId = (logs[0] as EventLog)?.returnValues?.tokenId as string;
			await contractDeployed.methods
				.transferFrom(tempAccount.address, toAccount.address, tokenId)
				.send({
					...sendOptions,
					type,
					from: tempAccount.address,
				});

			expect(
				toUpperCaseHex(
					(await contractDeployed.methods.ownerOf(tokenId).call()) as unknown as string,
				),
			).toBe(toUpperCaseHex(toAccount.address));
		});

		it.each(['0x2'])('should approve and then transferFrom item %p', async type => {
			const tempAccount = await createLocalAccount(web3);
			const toAccount = await createLocalAccount(web3);
			await contractDeployed.methods
				.awardItem(tempAccount.address, 'http://my-nft-award')
				.send({ ...sendOptions, type });

			const logs = await contractDeployed.getPastEvents('Transfer');
			const tokenId = (logs[0] as EventLog)?.returnValues?.tokenId as string;

			await contractDeployed.methods.approve(toAccount.address, tokenId).send({
				...sendOptions,
				type,
				from: tempAccount.address,
			});
			const res = await contractDeployed.methods.getApproved(tokenId).call();
			expect(res.toString().toUpperCase()).toBe(toAccount.address.toUpperCase());

			await contractDeployed.methods
				.safeTransferFrom(tempAccount.address, toAccount.address, tokenId)
				.send({
					...sendOptions,
					type,
					from: toAccount.address,
				});

			expect(
				toUpperCaseHex(
					(await contractDeployed.methods.ownerOf(tokenId).call()) as unknown as string,
				),
			).toBe(toUpperCaseHex(toAccount.address));
		});

		it.each(['0x2'])('should set approve for all item with local wallet %p', async type => {
			const tempAccount = await createLocalAccount(web3);
			const toAccount = await createLocalAccount(web3);

			await contractDeployed.methods.setApprovalForAll(toAccount.address, true).send({
				...sendOptions,
				type,
				from: tempAccount.address,
			});

			expect(
				await contractDeployed.methods
					.isApprovedForAll(tempAccount.address, toAccount.address)
					.call(),
			).toBe(true);

			await contractDeployed.methods.setApprovalForAll(toAccount.address, false).send({
				...sendOptions,
				type,
				from: tempAccount.address,
			});

			expect(
				await contractDeployed.methods
					.isApprovedForAll(tempAccount.address, toAccount.address)
					.call(),
			).toBe(false);
		});
	});
});
