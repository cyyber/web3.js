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
import { SupportedProviders, TransactionReceipt } from '@theqrl/web3-types';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Contract } from '@theqrl/web3-zond-contract';
import { Web3Zond } from '../../../src';
import {
	// getSystemTestBackend,
	getSystemTestProvider,
	createTempAccount,
	closeOpenConnection,
} from '../../fixtures/system_test_utils';
import { BasicAbi, BasicBytecode } from '../../shared_fixtures/build/Basic';
import { toAllVariants } from '../../shared_fixtures/utils';
import { sendFewTxes } from '../helper';

describe('rpc with block', () => {
	let web3Zond: Web3Zond;
	let clientUrl: string | SupportedProviders;

	let contract: Contract<typeof BasicAbi>;
	let deployOptions: Record<string, unknown>;
	let sendOptions: Record<string, unknown>;

	let blockData: {
		earliest: 'earliest';
		latest: 'latest';
		pending: 'pending';
		blockNumber: number | bigint;
		blockHash: string;
		transactionHash: string;
		transactionIndex: number | bigint;
	};
	let tempAcc: { address: string; seed: string };

	beforeAll(() => {
		clientUrl = getSystemTestProvider();
		web3Zond = new Web3Zond({
			provider: clientUrl,
			config: {
				transactionPollingTimeout: 15000,
			},
		});

		contract = new Contract(BasicAbi, undefined, {
			provider: clientUrl,
		});

		deployOptions = {
			data: BasicBytecode,
			arguments: [10, 'string init value'],
		};
	});
	beforeAll(async () => {
		tempAcc = await createTempAccount();
		sendOptions = { from: tempAcc.address /* gas: '1000000' */ };

		await contract.deploy(deployOptions).send(sendOptions);
		const [receipt]: TransactionReceipt[] = await sendFewTxes({
			from: tempAcc.address,
			value: '0x1',
			times: 1,
		});
		blockData = {
			pending: 'pending',
			latest: 'latest',
			earliest: 'earliest',
			blockNumber: Number(receipt.blockNumber),
			blockHash: String(receipt.blockHash),
			transactionHash: String(receipt.transactionHash),
			transactionIndex: Number(receipt.transactionIndex),
		};
	});
	afterAll(async () => {
		await closeOpenConnection(web3Zond);
		await closeOpenConnection(contract);
	});

	describe('methods', () => {
		it.each(
			toAllVariants<{
				block: 'earliest' | 'latest' | 'pending' | 'blockHash' | 'blockNumber';
			}>({
				block: ['earliest', 'latest', 'pending', 'blockHash', 'blockNumber'],
			}),
		)('getBlockTransactionCount', async ({ block }) => {
			const res = await web3Zond.getBlockTransactionCount(blockData[block]);
			const shouldBe = ['earliest', 'pending'].includes(String(blockData[block])) ? 0 : 1;
			expect(Number(res)).toBe(shouldBe);
		});
	});
});
