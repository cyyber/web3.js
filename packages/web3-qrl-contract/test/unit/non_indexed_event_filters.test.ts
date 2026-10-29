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

import { AbiError } from '@theqrl/web3-errors';
import { FMT_BYTES, FMT_NUMBER } from '@theqrl/web3-types';
import { Contract, EventLog } from '../../src';
import {
	ADDR,
	FakeProvider,
	RECEIPT,
	filterLogs,
	topicOf,
	uintWord,
} from '../fixtures/fake_provider';

const indexed = {
	type: 'event',
	name: 'Shared',
	inputs: [
		{ name: 'key', type: 'uint256', indexed: true },
		{ name: 'value', type: 'uint256', indexed: false },
	],
} as const;
const plain = {
	...indexed,
	inputs: [{ ...indexed.inputs[0], indexed: false }, indexed.inputs[1]],
} as const;
const signature = topicOf('Shared(uint256,uint256)');
const baseLog = {
	address: ADDR,
	blockNumber: '0x1',
	blockHash: RECEIPT.blockHash,
	transactionHash: RECEIPT.transactionHash,
	transactionIndex: '0x0',
	logIndex: '0x0',
	removed: false,
};
const indexedLogs = [20, 21, 22].map(value => ({
	...baseLog,
	topics: [signature, `0x${uintWord(7)}`],
	data: `0x${uintWord(value)}`,
}));
const plainLogs = [20, 21, 22].map(value => ({
	...baseLog,
	topics: [signature],
	data: `0x${uintWord(7)}${uintWord(value)}`,
}));
const scenarios = [
	{ label: 'single layout', abi: [indexed], name: 'Shared', logs: indexedLogs },
	{
		label: 'merged layouts',
		abi: [indexed, plain],
		name: 'Shared',
		logs: [...indexedLogs, ...plainLogs],
	},
	{
		label: 'reversed layouts',
		abi: [plain, indexed],
		name: 'Shared',
		logs: [...indexedLogs, ...plainLogs],
	},
	{ label: 'allEvents single layout', abi: [indexed], name: 'allEvents', logs: indexedLogs },
	{
		label: 'allEvents merged layouts',
		abi: [indexed, plain],
		name: 'allEvents',
		logs: [...indexedLogs, ...plainLogs],
	},
	{
		label: 'anonymous layout',
		abi: [{ ...indexed, anonymous: true }],
		name: 'Shared',
		logs: indexedLogs.map(log => ({ ...log, topics: log.topics.slice(1) })),
	},
] as const;
const formats = [
	{ number: FMT_NUMBER.BIGINT, bytes: FMT_BYTES.HEX },
	{ number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.UINT8ARRAY },
	{ number: FMT_NUMBER.STR, bytes: FMT_BYTES.HEX },
];

const setup = (scenario: (typeof scenarios)[number], returnFormat = formats[0]) => {
	const provider = new FakeProvider(
		(method, params) =>
			method === 'qrl_getLogs' ? filterLogs([...scenario.logs], params[0]) : undefined,
		true,
	);
	const contract = new Contract(
		scenario.abi,
		ADDR,
		{ provider: provider.asProvider() },
		returnFormat,
	);
	return { contract, provider };
};

describe.each(scenarios)('non-indexed subscription filters: $label (P11R-1)', scenario => {
	it.each(formats)(
		'matches past events in replay, live and removed logs (%j)',
		async returnFormat => {
			const { contract, provider } = setup(scenario, returnFormat);
			const filter = { value: [20, 22] };
			const past = await contract.getPastEvents(scenario.name, { filter }, returnFormat);
			expect(past).toHaveLength((scenario.logs.length / 3) * 2);
			const sub = contract.events[scenario.name]({ fromBlock: 0, filter });
			const data = jest.fn<void, [EventLog]>();
			const changed = jest.fn<void, [EventLog]>();
			const errors = jest.fn();
			sub.on('data', data);
			sub.on('changed', changed);
			sub.on('error', errors);
			await sub.subscribed;
			expect(data.mock.calls.map(([entry]) => entry)).toEqual(past);
			data.mockClear();
			const query = provider.lastCall('qrl_subscribe')?.params[1];
			for (const log of filterLogs([...scenario.logs], query)) {
				provider.notify(sub.id!, log);
				provider.notify(sub.id!, { ...log, removed: true });
			}
			expect(data.mock.calls.map(([entry]) => entry)).toEqual(past);
			expect(changed.mock.calls.map(([entry]) => entry)).toEqual(
				past.map(entry => ({ ...(entry as EventLog), removed: true })),
			);
			expect(errors).not.toHaveBeenCalled();
			await sub.unsubscribe();
		},
	);

	it.each(['invalid', [20, 'invalid']])(
		'rejects invalid non-indexed value %j before requests',
		async value => {
			const { contract, provider } = setup(scenario);
			expect(() =>
				contract.events[scenario.name]({ fromBlock: 0, filter: { value } }),
			).toThrow(AbiError);
			await expect(
				contract.getPastEvents(scenario.name, { filter: { value } }),
			).rejects.toThrow(AbiError);
			expect(provider.calls).toHaveLength(0);
		},
	);
});

test.each([
	{ filter: {}, expected: 3 },
	{ filter: { value: undefined }, expected: 3 },
	// eslint-disable-next-line no-null/no-null -- null filter values are wildcards
	{ filter: { value: null }, expected: 3 },
	{ filter: { value: [] }, expected: 0 },
	{ filter: { key: 7, value: 20 }, expected: 1 },
])('preserves wildcard, empty OR and indexed filters (%j)', async ({ filter, expected }) => {
	const { contract, provider } = setup(scenarios[0]);
	const sub = contract.events.Shared({ fromBlock: 0, filter });
	const data = jest.fn();
	sub.on('data', data);
	await sub.subscribed;
	expect(data).toHaveBeenCalledTimes(expected);
	data.mockClear();
	for (const log of indexedLogs) provider.notify(sub.id!, log);
	expect(data).toHaveBeenCalledTimes(expected);
	await sub.unsubscribe();
});

test('explicit topics override subscription filters in replay and live delivery', async () => {
	const { contract, provider } = setup(scenarios[1]);
	const sub = contract.events.Shared({
		fromBlock: 0,
		topics: [signature],
		filter: { value: 'invalid' },
	});
	const data = jest.fn();
	const errors = jest.fn();
	sub.on('data', data);
	sub.on('error', errors);
	await sub.subscribed;
	expect(data).toHaveBeenCalledTimes(6);
	data.mockClear();
	for (const log of [...indexedLogs, ...plainLogs]) provider.notify(sub.id!, log);
	expect(data).toHaveBeenCalledTimes(6);
	expect(errors).not.toHaveBeenCalled();
	await sub.unsubscribe();
});

test('allEvents validates shared filter names against every matching layout', () => {
	const named = {
		type: 'event',
		name: 'Named',
		inputs: [{ name: 'value', type: 'string', indexed: false }],
	} as const;
	const provider = new FakeProvider(() => undefined, true);
	const contract = new Contract([indexed, named], ADDR, { provider: provider.asProvider() });
	expect(() => contract.events.allEvents({ filter: { value: 20 } })).toThrow(AbiError);
	expect(provider.calls).toHaveLength(0);
});
