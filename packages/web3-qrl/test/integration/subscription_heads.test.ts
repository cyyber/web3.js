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
import { BlockHeaderOutput, SupportedProviders } from '@theqrl/web3-types';
import { Web3QRL, NewHeadsSubscription } from '../../src';
import { Resolve } from './helper';
import {
	closeOpenConnection,
	describeIf,
	getSystemTestProvider,
	isSocket,
	sendFewSampleTxs,
	waitForOpenConnection,
} from '../fixtures/system_test_utils';

const checkTxCount = 2;
describeIf(isSocket)('subscription', () => {
	let clientUrl: string | SupportedProviders;
	let web3QRL: Web3QRL;
	beforeEach(() => {
		clientUrl = getSystemTestProvider();
	});
	describe('heads', () => {
		it(`wait for ${checkTxCount} newHeads`, async () => {
			web3QRL = new Web3QRL(clientUrl);
			const sub = await web3QRL.subscribe('newHeads');
			await waitForOpenConnection(web3QRL);
			let times = 0;
			const pr = new Promise((resolve: Resolve, reject) => {
				sub.on('data', (data: BlockHeaderOutput) => {
					try {
						expect(typeof data.hash).toBe('string');
						expect(typeof data.parentHash).toBe('string');
						expect(typeof data.receiptsRoot).toBe('string');
						expect(typeof data.miner).toBe('string');
						expect(typeof data.stateRoot).toBe('string');
						expect(typeof data.transactionsRoot).toBe('string');
						expect(typeof data.logsBloom).toBe('string');
						expect(typeof data.number).toBe('bigint');
						expect(typeof data.gasLimit).toBe('bigint');
						expect(typeof data.gasUsed).toBe('bigint');
						expect(typeof data.timestamp).toBe('bigint');
						expect(typeof data.extraData).toBe('string');
						expect(typeof data.baseFeePerGas).toBe('bigint');
						expect(typeof data.prevRandao).toBe('string');
					} catch (error) {
						reject(error);
					}

					times += 1;
					expect(times).toBeGreaterThanOrEqual(times);
					if (times >= checkTxCount) {
						resolve();
					}
				});
				sub.on('error', error => {
					reject(error);
				});
			});
			// eslint-disable-next-line no-void
			void sendFewSampleTxs(checkTxCount);

			await pr;
			sub.off('data', () => {
				// do nothing
			});
			await web3QRL.subscriptionManager?.removeSubscription(sub);
			await closeOpenConnection(web3QRL);
		});
		it(`remove at subscriptionManager`, async () => {
			const removalWeb3QRL = new Web3QRL(clientUrl);
			await waitForOpenConnection(removalWeb3QRL);
			const sub: NewHeadsSubscription = await removalWeb3QRL.subscribe('newHeads');
			expect(sub.id).toBeDefined();
			const subId = sub.id as string;
			await removalWeb3QRL.subscriptionManager?.removeSubscription(sub);
			expect(removalWeb3QRL.subscriptionManager.subscriptions.has(subId)).toBe(false);
			expect(sub.id).toBeUndefined();
			await closeOpenConnection(removalWeb3QRL);
		});
		it(`remove at subscribe object`, async () => {
			const unsubscribingWeb3QRL = new Web3QRL(clientUrl);
			await waitForOpenConnection(unsubscribingWeb3QRL);
			const sub: NewHeadsSubscription = await unsubscribingWeb3QRL.subscribe('newHeads');
			expect(sub.id).toBeDefined();
			const subId = sub.id as string;
			await sub.unsubscribe();
			expect(unsubscribingWeb3QRL.subscriptionManager.subscriptions.has(subId)).toBe(false);
			expect(sub.id).toBeUndefined();
			await closeOpenConnection(unsubscribingWeb3QRL);
		});
	});
});
