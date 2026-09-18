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
import { Web3SubscriptionManager } from '@theqrl/web3-core';
import { SyncOutput } from '@theqrl/web3-types';
import { SyncingSubscription } from '../../src/web3_subscriptions';

describe('SyncingSubscription', () => {
	// gqrl notifies its SyncProgress struct as-is: PascalCase keys and decimal numbers,
	// including the snap sync counters and the zeroed legacy fast sync counters.
	const gqrlStatus = {
		StartingBlock: 100,
		CurrentBlock: 150,
		HighestBlock: 200,
		PulledStates: 0,
		KnownStates: 0,
		SyncedAccounts: 12,
		SyncedAccountBytes: 3456,
		SyncedBytecodes: 3,
		SyncedBytecodeBytes: 789,
		SyncedStorage: 45,
		SyncedStorageBytes: 6789,
		HealedTrienodes: 1,
		HealedTrienodeBytes: 23,
		HealedBytecodes: 0,
		HealedBytecodeBytes: 0,
		HealingTrienodes: 4,
		HealingBytecode: 0,
	};

	const newSubscription = () => {
		const requestManager = { send: jest.fn(), on: jest.fn(), provider: { on: jest.fn() } };
		const subManager = new Web3SubscriptionManager(requestManager as any, undefined as any);
		return new SyncingSubscription(undefined, { subscriptionManager: subManager });
	};

	it('should emit the full gqrl sync progress, including snap sync counters', () => {
		const sub = newSubscription();
		const dataHandler = jest.fn();
		const changedHandler = jest.fn();
		sub.on('data', dataHandler);
		sub.on('changed', changedHandler);

		sub._processSubscriptionResult({ syncing: true, status: gqrlStatus as unknown as SyncOutput });

		expect(changedHandler).toHaveBeenCalledWith(true);
		expect(dataHandler).toHaveBeenCalledTimes(1);
		expect(dataHandler.mock.calls[0][0]).toStrictEqual({
			startingBlock: 100,
			currentBlock: 150,
			highestBlock: 200,
			pulledStates: 0,
			knownStates: 0,
			syncedAccounts: 12,
			syncedAccountBytes: 3456,
			syncedBytecodes: 3,
			syncedBytecodeBytes: 789,
			syncedStorage: 45,
			syncedStorageBytes: 6789,
			healedTrienodes: 1,
			healedTrienodeBytes: 23,
			healedBytecodes: 0,
			healedBytecodeBytes: 0,
			healingTrienodes: 4,
			healingBytecode: 0,
		});
	});

	it('should only emit changed when the node reports it is done syncing', () => {
		const sub = newSubscription();
		const dataHandler = jest.fn();
		const changedHandler = jest.fn();
		sub.on('data', dataHandler);
		sub.on('changed', changedHandler);

		sub._processSubscriptionResult(false);

		expect(changedHandler).toHaveBeenCalledWith(false);
		expect(dataHandler).not.toHaveBeenCalled();
	});
});
