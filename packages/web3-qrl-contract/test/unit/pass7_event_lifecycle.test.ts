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

import { Contract, EventLog } from '../../src';
import { ADDR, FakeProvider, RECEIPT, topicOf, uintWord, flush } from '../fixtures/fake_provider';

const event = {
	type: 'event',
	name: 'Value',
	inputs: [{ name: 'value', type: 'uint256', indexed: false }],
	anonymous: false,
} as const;
const log = {
	address: ADDR,
	blockNumber: '0x1',
	blockHash: RECEIPT.blockHash,
	transactionHash: RECEIPT.transactionHash,
	transactionIndex: '0x0',
	logIndex: '0x0',
	removed: false,
	topics: [topicOf('Value(uint256)')],
	data: `0x${uintWord(7)}`,
};

test.each(['Value', 'allEvents'] as const)(
	'keeps matching past logs when a shared signature has another topic count (%s)',
	async name => {
		const provider = new FakeProvider(method =>
			method === 'qrl_getLogs'
				? [log, { ...log, topics: [...log.topics, topicOf('Other(uint256)')] }, log]
				: undefined,
		);
		const contract = new Contract([event], ADDR, { provider: provider.asProvider() });
		const logs = await contract.getPastEvents(name);
		expect(logs).toHaveLength(2);
		expect((logs[0] as EventLog).returnValues.value).toBe(BigInt(7));
	},
);

test.each(['fast', 'slow'])(
	'never emits backfill when live subscription fails (%s backfill)',
	async mode => {
		let release!: (logs: (typeof log)[]) => void;
		const backfill = new Promise<(typeof log)[]>(resolve => {
			release = resolve;
		});
		const provider = new FakeProvider(async method => {
			if (method === 'qrl_subscribe') throw new Error('subscribe refused');
			if (method === 'qrl_getLogs') return mode === 'fast' ? [log] : backfill;
			return undefined;
		}, true);
		const contract = new Contract([event], ADDR, { provider: provider.asProvider() });
		const sub = contract.events.Value({ fromBlock: 0 });
		const data = jest.fn();
		const errors = jest.fn();
		sub.on('data', data);
		sub.on('error', errors);
		await expect(sub.subscribed).rejects.toThrow('Failed to subscribe');
		release([log]);
		await flush();
		expect(data).not.toHaveBeenCalled();
		expect(errors).toHaveBeenCalledTimes(1);
		expect(contract.subscriptionManager.subscriptions.size).toBe(0);
	},
);

test('reports only the backfill failure when cancellation precedes a late subscription reply', async () => {
	let release!: (id: string) => void;
	const registration = new Promise<string>(resolve => {
		release = resolve;
	});
	const provider = new FakeProvider(async method => {
		if (method === 'qrl_subscribe') return registration;
		if (method === 'qrl_getLogs') throw new Error('logs refused');
		return undefined;
	}, true);
	const contract = new Contract([event], ADDR, { provider: provider.asProvider() });
	const sub = contract.events.Value({ fromBlock: 0 });
	const errors = jest.fn();
	sub.on('error', errors);
	await expect(sub.subscribed).rejects.toThrow('Failed to get past events');
	release('0xa');
	await flush();
	expect(errors).toHaveBeenCalledTimes(1);
	expect(provider.lastCall('qrl_unsubscribe')?.params).toEqual(['0xa']);
	expect(contract.subscriptionManager.subscriptions.size).toBe(0);
});

test('includes log identity in a live topic-count error', async () => {
	const provider = new FakeProvider(
		method => (method === 'qrl_subscribe' ? '0x1' : undefined),
		true,
	);
	const contract = new Contract([event], ADDR, { provider: provider.asProvider() });
	const sub = contract.events.Value();
	const errors = jest.fn();
	sub.on('error', errors);
	await sub.subscribed;
	provider.notify('0x1', { ...log, topics: [...log.topics, topicOf('Other(uint256)')] });
	expect(errors.mock.calls[0][0].message).toContain(log.transactionHash);
	expect(errors.mock.calls[0][0].message).toContain('logIndex: 0x0');
	await sub.unsubscribe();
});

test('encodes a safe boundary number through the contract API', () => {
	const contract = new Contract([
		{
			type: 'function',
			name: 'big',
			inputs: [{ name: 'x', type: 'uint256' }],
			outputs: [],
			stateMutability: 'nonpayable',
		},
	] as const);
	expect(contract.methods.big(Number.MAX_SAFE_INTEGER).encodeABI()).toBe(
		contract.methods.big(String(Number.MAX_SAFE_INTEGER)).encodeABI(),
	);
});
