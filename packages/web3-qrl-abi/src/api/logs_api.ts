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

import { HexString, AbiParameter, DecodedParams } from '@theqrl/web3-types';
import { AbiError } from '@theqrl/web3-errors';
import { decodeParameter, decodeParametersWith, encodeParameter } from './parameters_api.js';

const STATIC_TYPES = ['bool', 'int', 'uint', 'address', 'fixed', 'ufixed'];

const isStaticIndexedType = (input: AbiParameter): boolean =>
	!input.type.includes('[') &&
	!input.type.startsWith('tuple') &&
	(STATIC_TYPES.some(type => input.type.startsWith(type)) || /^bytes\d+$/.test(input.type));

const decodeTopic = (input: AbiParameter, topic: string): unknown => {
	if (!/^0x[0-9a-f]{128}$/i.test(topic)) {
		throw new AbiError(
			`Invalid indexed topic for "${input.name ?? input.type}": expected 64 bytes.`,
		);
	}
	if (!isStaticIndexedType(input)) {
		if (topic.slice(66) !== '0'.repeat(64)) {
			throw new AbiError(
				`Non-canonical indexed hash topic for "${input.name ?? input.type}".`,
			);
		}
		return topic.toLowerCase();
	}

	const decoded = decodeParameter(input.type, topic);
	const canonical = encodeParameter(input.type, decoded);
	if (canonical.toLowerCase() !== topic.toLowerCase()) {
		throw new AbiError(`Non-canonical indexed topic for "${input.name ?? input.type}".`);
	}
	return decoded;
};

/**
 * Decodes ABI-encoded log data and indexed topic data.
 * @param inputs - A {@link AbiParameter} input array. See the [Hyperion documentation](https://docs.soliditylang.org/en/develop/types.html) for a list of types.
 * @param data - The ABI byte code in the `data` field of a log.
 * @param topics - An array with the index parameter topics of the log, without the topic[0] if its a non-anonymous event, otherwise with topic[0]
 * @returns - The result object containing the decoded parameters.
 *
 * @example
 * ```ts
 * let res = web3.qrl.abi.decodeLog(
 *    [
 *      {
 *        type: "string",
 *        name: "myString",
 *      },
 *      {
 *        type: "uint256",
 *        name: "myNumber",
 *        indexed: true,
 *      },
 *      {
 *        type: "uint8",
 *        name: "mySmallNumber",
 *        indexed: true,
 *      },
 *    ],
 *    "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000748656c6c6f252100000000000000000000000000000000000000000000000000",
 *    [
 *      "0x000000000000000000000000000000000000000000000000000000000000f310",
 *      "0x0000000000000000000000000000000000000000000000000000000000000010",
 *    ]
 *  );
 * > {
 *  '0': 'Hello%!',
 *  '1': 62224n,
 *  '2': 16n,
 *  __length__: 3,
 *  myString: 'Hello%!',
 *  myNumber: 62224n,
 *  mySmallNumber: 16n
 * }
 * ```
 */
export const decodeLog = <ReturnType extends DecodedParams>(
	inputs: Array<AbiParameter>,
	data: HexString,
	topics: string | string[],
) => {
	const clonedTopics = Array.isArray(topics) ? topics : [topics];

	const indexedInputs: Record<number, AbiParameter> = {};
	const nonIndexedInputs: Record<number, AbiParameter> = {};

	for (const [i, input] of inputs.entries()) {
		if (input.indexed) {
			indexedInputs[i] = input;
		} else {
			nonIndexedInputs[i] = input;
		}
	}

	const decodedNonIndexedInputs: DecodedParams = data
		? decodeParametersWith(Object.values(nonIndexedInputs), data, true)
		: { __length__: 0 };

	const indexedInputValues = Object.values(indexedInputs);
	if (clonedTopics.length !== indexedInputValues.length) {
		throw new AbiError(
			`Indexed topic count mismatch: expected ${indexedInputValues.length}, got ${clonedTopics.length}.`,
		);
	}

	const decodedIndexedInputs = indexedInputValues.map((input, index) =>
		decodeTopic(input, clonedTopics[index]),
	);

	const returnValues: DecodedParams = { __length__: 0 };

	let indexedCounter = 0;
	let nonIndexedCounter = 0;

	for (const [i, res] of inputs.entries()) {
		returnValues[i] = res.type === 'string' ? '' : undefined;

		if (indexedInputs[i]) {
			returnValues[i] = decodedIndexedInputs[indexedCounter];
			indexedCounter += 1;
		}

		if (nonIndexedInputs[i]) {
			returnValues[i] = decodedNonIndexedInputs[String(nonIndexedCounter)];
			nonIndexedCounter += 1;
		}

		if (res.name) {
			returnValues[res.name] = returnValues[i];
		}

		returnValues.__length__ += 1;
	}

	return returnValues as ReturnType;
};
