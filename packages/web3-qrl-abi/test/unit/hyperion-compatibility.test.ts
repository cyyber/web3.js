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

import { Eip838ExecutionError } from '@theqrl/web3-errors';
import {
	AbiErrorFragment,
	AbiEventFragment,
	AbiFunctionFragment,
	AbiParameter,
} from '@theqrl/web3-types';
import fixture from '../../../../fixtures/abi/hyperion-0.3.1.json';
import { decodeParameters, encodeParameters } from '../../src/api/parameters_api';
import { encodeFunctionCall, encodeFunctionSignature } from '../../src/api/functions_api';
import { decodeLog } from '../../src/api/logs_api';
import { encodeEventSignature } from '../../src/api/events_api';
import { encodeErrorSignature } from '../../src/api/errors_api';
import { decodeContractErrorData } from '../../src/decode_contract_error_data';
import { jsonInterfaceMethodToString } from '../../src/utils';

describe('Hyperion compiler ABI compatibility', () => {
	it.each(fixture.cases.filter(test => !test.packed && !test.panic))(
		'$name matches the compiler through the public API',
		({ inputs, values, encoded }) => {
			expect(encodeParameters(inputs, values)).toBe(encoded);
			const decoded = decodeParameters(inputs, encoded);
			expect(decoded.__length__).toBe(inputs.length);
			expect(
				encodeParameters(
					inputs,
					inputs.map((_, index) => decoded[index]),
				),
			).toBe(encoded);
		},
	);

	it('accepts function values as bytes through the public API', () => {
		const pointer = new Uint8Array(68).fill(0xab);
		const encoded = encodeParameters(['function'], [pointer]);
		expect(decodeParameters(['function'], encoded)[0]).toBe(`0x${'ab'.repeat(68)}`);
	});

	it.each([encodeFunctionSignature, encodeEventSignature, encodeErrorSignature])(
		'canonicalizes integer aliases in string signatures',
		encodeSignature => {
			expect(encodeSignature('uint(uint,int[],(uint[2],int))')).toBe(
				encodeSignature('uint(uint512,int512[],(uint512[2],int512))'),
			);
			expect(encodeSignature('uint(uint)')).not.toBe(encodeSignature('uint(uint256)'));
		},
	);

	it('canonicalizes nested integer aliases in JSON signatures', () => {
		const inputs: AbiParameter[] = [
			{ name: 'values', type: 'uint[]' },
			{
				name: 'pair',
				type: 'tuple',
				components: [
					{ name: 'a', type: 'int' },
					{ name: 'b', type: 'uint[2]' },
				],
			},
		];
		expect(jsonInterfaceMethodToString({ type: 'function', name: 'foo', inputs })).toBe(
			'foo(uint512[],(int512,uint512[2]))',
		);
		expect(encodeFunctionSignature({ type: 'function', name: 'foo', inputs })).toBe(
			encodeFunctionSignature('foo(uint512[],(int512,uint512[2]))'),
		);
	});

	it.each(fixture.cases.filter(test => test.panic))(
		'decodes $name without a builtin error entry in the ABI',
		({ encoded, code }) => {
			expect(encoded.slice(0, 10)).toBe('0xdf75fb3b');
			expect(encoded).toHaveLength(2 + (4 + 64) * 2);
			const error = new Eip838ExecutionError({ code: 3, message: 'reverted', data: encoded });
			decodeContractErrorData([], error);
			expect(error.errorName).toBe('Panic');
			expect(error.errorSignature).toBe('Panic(uint512)');
			expect(error.errorArgs?.code).toBe(BigInt(code as string));
		},
	);

	it('still decodes the Panic(uint256) of contracts compiled by Hyperion 0.2.0', () => {
		// The revert payload of `assert(false)` in the Hyperion 0.2.0 fixture, executed in go-qrl.
		const data = `0x4e487b71${'00'.repeat(63)}01`;
		const error = new Eip838ExecutionError({ code: 3, message: 'reverted', data });
		decodeContractErrorData([], error);
		expect(error.errorName).toBe('Panic');
		expect(error.errorSignature).toBe('Panic(uint256)');
		expect(error.errorArgs?.code).toBe(BigInt(1));
	});

	it.each(Object.entries(fixture.methodIdentifiers))(
		'derives the compiler selector of %s',
		(signature, selector) => {
			expect(encodeFunctionSignature(signature)).toBe(`0x${selector}`);
			const name = signature.slice(0, signature.indexOf('('));
			const entry = fixture.abi.find(item => item.type === 'function' && item.name === name);
			expect(encodeFunctionSignature(entry as AbiFunctionFragment)).toBe(`0x${selector}`);
		},
	);

	const functionEntry = (name: string) =>
		fixture.abi.find(
			item => item.type === 'function' && item.name === name,
		) as AbiFunctionFragment;

	it.each(fixture.calls)(
		'$signature encodes the call data the compiler decodes',
		({ name, signature, values, callData }) => {
			expect(encodeFunctionSignature(signature)).toBe(callData.slice(0, 10));
			expect(encodeFunctionCall(functionEntry(name), values)).toBe(callData);
		},
	);

	it('echo returns the arguments the compiler decoded from the call data', () => {
		const [{ callData, returned }] = fixture.calls.filter(call => call.name === 'echo');
		expect(decodeParameters(['bytes'], returned)[0]).toBe(`0x${callData.slice(10)}`);
	});

	it.each(fixture.calls.filter(call => call.name !== 'echo' && !call.reverted))(
		'decodes the value returned by the $canonical getter',
		({ name, returned }) => {
			const outputs = functionEntry(name).outputs as AbiParameter[];
			expect(encodeParameters(outputs, [decodeParameters(outputs, returned)[0]])).toBe(
				returned,
			);
		},
	);

	it.each(fixture.events)(
		'decodes the log of $signature with 64-byte topics',
		({ signature, abi, topics, data, values }) => {
			const event = abi as AbiEventFragment;
			// The 32-byte signature hash is left-aligned in the 64-byte topic.
			expect(topics[0]).toBe(encodeEventSignature(signature));
			expect(topics[0]).toHaveLength(2 + 128);
			expect(encodeEventSignature(event)).toBe(encodeEventSignature(signature));
			const decoded = decodeLog([...event.inputs], data, topics.slice(1));
			expect(String(decoded.who).toLowerCase()).toBe(values.who.toLowerCase());
			expect(decoded.wide).toBe(values.wide);
			expect(decoded.id).toBe(BigInt(values.id));
			expect(decoded.value).toBe(BigInt(values.value));
			expect(decoded.note).toBe(values.note);
		},
	);

	it.each(fixture.errors)(
		'decodes the revert data of $name',
		({ error: errorName, encoded, values }) => {
			const errorsAbi = fixture.abi.filter(
				item => item.type === 'error',
			) as AbiErrorFragment[];
			const error = new Eip838ExecutionError({ code: 3, message: 'reverted', data: encoded });
			decodeContractErrorData(errorsAbi, error);
			expect(error.errorName).toBe(errorName);
			const args = error.errorArgs as Record<string, unknown>;
			expect(values.map((_, index) => String(args[index]).toLowerCase())).toEqual(
				values.map(value => value.toLowerCase()),
			);
		},
	);

	it('decodes Error(string) without an ABI entry', () => {
		const error = new Eip838ExecutionError({
			code: 3,
			message: 'reverted',
			data: `0x08c379a0${encodeParameters(['string'], ['reason']).slice(2)}`,
		});
		decodeContractErrorData([], error);
		expect(error.errorSignature).toBe('Error(string)');
		expect(error.errorArgs?.message).toBe('reason');
	});

	it('gives an explicit error ABI precedence over the builtin fallback', () => {
		const abi: AbiErrorFragment = {
			type: 'error',
			name: 'Panic',
			inputs: [{ type: 'uint256', name: 'customCode' }],
		};
		const error = new Eip838ExecutionError({
			code: 3,
			message: 'reverted',
			data: `0x4e487b71${encodeParameters(['uint256'], [1]).slice(2)}`,
		});
		decodeContractErrorData([abi], error);
		expect(error.errorArgs?.customCode).toBe(BigInt(1));
		expect(error.errorArgs?.code).toBeUndefined();
	});

	it('gives an explicit Panic(uint512) error ABI precedence over the builtin fallback', () => {
		const abi: AbiErrorFragment = {
			type: 'error',
			name: 'Panic',
			inputs: [{ type: 'uint512', name: 'wideCode' }],
		};
		const error = new Eip838ExecutionError({
			code: 3,
			message: 'reverted',
			data: `0xdf75fb3b${encodeParameters(['uint512'], [1]).slice(2)}`,
		});
		decodeContractErrorData([abi], error);
		expect(error.errorSignature).toBe('Panic(uint512)');
		expect(error.errorArgs?.wideCode).toBe(BigInt(1));
		expect(error.errorArgs?.code).toBeUndefined();
	});
});
