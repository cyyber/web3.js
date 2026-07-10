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

import { format, isNullish, keccak256, utf8ToHex } from '@theqrl/web3-utils';
import { isAddressString, isFilterObject, isTopic } from '@theqrl/web3-validator';

import {
	AbiConstructorFragment,
	AbiEventFragment,
	AbiFunctionFragment,
	LogsInput,
	Filter,
	HexString,
	Topic,
	TopicFilter,
	FMT_NUMBER,
	FMT_BYTES,
	DataFormat,
	DEFAULT_RETURN_FORMAT,
} from '@theqrl/web3-types';

import {
	decodeLog,
	decodeParameters,
	encodeEventSignature,
	encodeFunctionSignature,
	encodeParameter,
	encodeParameters,
	isAbiConstructorFragment,
	jsonInterfaceMethodToString,
} from '@theqrl/web3-qrl-abi';

import { blockSchema, logSchema } from '@theqrl/web3-qrl';

import { Web3ContractError } from '@theqrl/web3-errors';

// eslint-disable-next-line import/no-cycle
import { ContractOptions, ContractAbiWithSignature, EventLog } from './types.js';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const serializeEventTopic = (signature: string): Topic => {
	if (isTopic(signature)) {
		if (signature.slice(66) !== '0'.repeat(64)) {
			throw new Web3ContractError(`Invalid event signature: ${signature}`);
		}
		return signature.toLowerCase();
	}
	if (!/^0x[0-9a-f]{64}$/i.test(signature)) {
		throw new Web3ContractError(`Invalid event signature: ${signature}`);
	}
	return `${signature.toLowerCase()}${'0'.repeat(64)}`;
};

const encodeIndexedTopic = (type: string, value: unknown): Topic => {
	if (type === 'string') {
		if (typeof value !== 'string') {
			throw new Web3ContractError('Indexed string filter values must be strings.');
		}
		return serializeEventTopic(keccak256(utf8ToHex(value)));
	}
	if (type === 'bytes') {
		return serializeEventTopic(keccak256(value as string | Uint8Array));
	}
	return encodeParameter(type, value) as Topic;
};

const encodeCompositeFilterTopic = (name: string, value: unknown): Topic | Topic[] => {
	if (typeof value === 'string' && isTopic(value)) return value.toLowerCase();
	if (Array.isArray(value)) {
		const topics = value as unknown[];
		if (topics.every((item): item is string => typeof item === 'string' && isTopic(item))) {
			return topics.map(item => item.toLowerCase());
		}
	}
	throw new Web3ContractError(
		`Indexed tuple and array filter "${name}" requires precomputed 64-byte topics.`,
	);
};

export const encodeEventABI = (
	{ address }: ContractOptions,
	event: AbiEventFragment & { signature: string },
	options?: Filter,
) => {
	const topics = options?.topics;
	const filter = options?.filter ?? {};
	const opts: Writeable<Filter> = {};

	if (!isNullish(options?.fromBlock)) {
		opts.fromBlock = format(blockSchema.properties.number, options?.fromBlock, {
			number: FMT_NUMBER.HEX,
			bytes: FMT_BYTES.HEX,
		});
	}
	if (!isNullish(options?.toBlock)) {
		opts.toBlock = format(blockSchema.properties.number, options?.toBlock, {
			number: FMT_NUMBER.HEX,
			bytes: FMT_BYTES.HEX,
		});
	}

	if (topics && Array.isArray(topics)) {
		opts.topics = [...topics] as TopicFilter[];
	} else {
		opts.topics = [];
		// add event signature
		if (event && !event.anonymous && event.name !== 'ALLEVENTS') {
			opts.topics.push(
				serializeEventTopic(
					event.signature ?? encodeEventSignature(jsonInterfaceMethodToString(event)),
				),
			);
		}

		// add event topics (indexed arguments)
		if (event.name !== 'ALLEVENTS' && event.inputs) {
			for (const input of event.inputs) {
				if (!input.indexed) {
					continue;
				}

				const value = filter[input.name];
				if (isNullish(value)) {
					// eslint-disable-next-line no-null/no-null
					opts.topics.push(null);
					continue;
				}

				if (input.type.startsWith('tuple') || input.type.includes('[')) {
					opts.topics.push(encodeCompositeFilterTopic(input.name, value));
				} else if (Array.isArray(value)) {
					opts.topics.push(value.map(v => encodeIndexedTopic(input.type, v)));
				} else {
					opts.topics.push(encodeIndexedTopic(input.type, value));
				}
			}
		}
	}

	if (!opts.topics.length) delete opts.topics;

	if (address) {
		if (!isAddressString(address)) {
			throw new Web3ContractError(
				`Invalid filter address: ${address}; expected a Q-prefixed QRL address`,
			);
		}
		opts.address = `Q${address.slice(1).toLowerCase()}`;
	}
	if (!isFilterObject(opts)) {
		throw new Web3ContractError('Invalid event filter options.');
	}

	return opts;
};

export const decodeEventABI = (
	event: AbiEventFragment & { signature: string },
	data: LogsInput,
	jsonInterface: ContractAbiWithSignature,
	returnFormat: DataFormat = DEFAULT_RETURN_FORMAT,
): EventLog => {
	let modifiedEvent = { ...event };

	const result = format(logSchema, data, returnFormat);
	const rawTopics = data.topics ?? [];

	// if allEvents get the right event
	if (modifiedEvent.name === 'ALLEVENTS') {
		const matchedEvent = rawTopics[0]
			? jsonInterface.find(
					j =>
						j.type === 'event' &&
						serializeEventTopic(j.signature).toLowerCase() ===
							rawTopics[0].toLowerCase(),
			  )
			: undefined;
		if (matchedEvent) {
			modifiedEvent = matchedEvent as AbiEventFragment & { signature: string };
		} else {
			return {
				...result,
				returnValues: { __length__: 0 },
				event: undefined,
				signature: undefined,
				raw: { data: data.data, topics: rawTopics },
			};
		}
	}

	// create empty inputs if none are present (e.g. anonymous events on allEvents)
	modifiedEvent.inputs = modifiedEvent.inputs ?? event.inputs ?? [];

	const indexedInputs = modifiedEvent.inputs.filter(input => input.indexed).length;
	const expectedTopicCount = indexedInputs + (modifiedEvent.anonymous ? 0 : 1);
	if (rawTopics.length !== expectedTopicCount) {
		throw new Web3ContractError(
			`Event topic count mismatch: expected ${expectedTopicCount}, got ${rawTopics.length}.`,
		);
	}

	if (!modifiedEvent.anonymous) {
		const expectedSignature = serializeEventTopic(
			modifiedEvent.signature ??
				encodeEventSignature(jsonInterfaceMethodToString(modifiedEvent)),
		);
		if (rawTopics[0].toLowerCase() !== expectedSignature.toLowerCase()) {
			throw new Web3ContractError('Event signature does not match the first log topic.');
		}
	}

	const argTopics = modifiedEvent.anonymous ? rawTopics : rawTopics.slice(1);
	return {
		...result,
		returnValues: decodeLog([...(modifiedEvent.inputs ?? [])], data.data, argTopics),
		event: modifiedEvent.name,
		signature:
			modifiedEvent.anonymous || !data.topics || data.topics.length === 0 || !data.topics[0]
				? undefined
				: rawTopics[0],

		raw: {
			data: data.data,
			topics: rawTopics,
		},
	};
};

export const encodeMethodABI = (
	abi: AbiFunctionFragment | AbiConstructorFragment,
	args: unknown[],
	deployData?: HexString,
) => {
	const inputLength = Array.isArray(abi.inputs) ? abi.inputs.length : 0;
	if (inputLength !== args.length) {
		throw new Web3ContractError(
			`The number of arguments is not matching the methods required number. You need to pass ${inputLength} arguments.`,
		);
	}

	const params = encodeParameters(Array.isArray(abi.inputs) ? abi.inputs : [], args).replace(
		'0x',
		'',
	);

	if (isAbiConstructorFragment(abi)) {
		if (!deployData)
			throw new Web3ContractError(
				'The contract has no contract data option set. This is necessary to append the constructor parameters.',
			);

		if (!deployData.startsWith('0x')) {
			return `0x${deployData}${params}`;
		}

		return `${deployData}${params}`;
	}

	return `${encodeFunctionSignature(abi)}${params}`;
};

export const decodeMethodReturn = (abi: AbiFunctionFragment, returnValues?: HexString) => {
	// If it was constructor then we need to return contract address
	if (abi.type === 'constructor') {
		return returnValues;
	}

	if (!returnValues) {
		// Using "null" value intentionally to match legacy behavior
		// eslint-disable-next-line no-null/no-null
		return null;
	}

	const value = returnValues.length >= 2 ? returnValues.slice(2) : returnValues;
	if (!abi.outputs) {
		// eslint-disable-next-line no-null/no-null
		return null;
	}
	const result = decodeParameters([...abi.outputs], value);

	if (result.__length__ === 1) {
		return result[0];
	}

	return result;
};
