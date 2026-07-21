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

import { Web3RequestManager } from '@theqrl/web3-core';
import { Eip712TypedData } from '@theqrl/web3-types';

import { qrlRpcMethods } from '../../../src/index';

// Deliberately NOT mocking @theqrl/web3-validator: the sibling sign_typed_data.test.ts mocks it
// and can therefore only assert the call shape. This file exercises the real validator, which is
// the only way to prove the guard actually fires rather than being registered but inert.

const address =
	'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000eb014f8c8b418db6b45774c326a0e64c78914dc0';

const validTypedData = {
	types: {
		EIP712Domain: [
			{ name: 'name', type: 'string' },
			{ name: 'chainId', type: 'uint256' },
		],
		Message: [{ name: 'contents', type: 'string' }],
	},
	primaryType: 'Message',
	domain: { name: 'QRL', chainId: 1 },
	message: { contents: 'hello' },
} as unknown as Eip712TypedData;

const clone = () => JSON.parse(JSON.stringify(validTypedData)) as Record<string, any>;

describe('signTypedData - typed data validation', () => {
	let requestManager: Web3RequestManager;
	let sendSpy: jest.Mock;

	beforeEach(() => {
		requestManager = new Web3RequestManager('http://127.0.0.1:8545');
		sendSpy = jest.fn().mockResolvedValue('0x00');
		requestManager.send = sendSpy;
	});

	it('should send the request when typed data is well-formed', async () => {
		await qrlRpcMethods.signTypedData(requestManager, address, validTypedData);
		expect(sendSpy).toHaveBeenCalledTimes(1);
	});

	// Each case below would otherwise reach the wallet and fail inside getEncodedEip712Data with
	// an opaque TypeError. The request must not be sent at all.
	it.each([
		[
			'types.EIP712Domain missing',
			() => {
				const d = clone();
				delete d.types.EIP712Domain;
				return d;
			},
		],
		[
			'primaryType not declared in types',
			() => {
				const d = clone();
				d.primaryType = 'NotDeclared';
				return d;
			},
		],
		[
			'message missing',
			() => {
				const d = clone();
				delete d.message;
				return d;
			},
		],
		[
			'domain missing',
			() => {
				const d = clone();
				delete d.domain;
				return d;
			},
		],
		[
			'type member missing its type field',
			() => {
				const d = clone();
				delete d.types.Message[0].type;
				return d;
			},
		],
		['typed data is not an object', () => 'nonsense' as unknown as Record<string, any>],
	])('should reject and not send the request when %s', async (_, build) => {
		const malformed = build() as unknown as Eip712TypedData;

		await expect(
			qrlRpcMethods.signTypedData(requestManager, address, malformed),
		).rejects.toThrow();
		expect(sendSpy).not.toHaveBeenCalled();
	});

	it('should still reject an invalid address', async () => {
		await expect(
			qrlRpcMethods.signTypedData(requestManager, 'not-an-address', validTypedData),
		).rejects.toThrow();
		expect(sendSpy).not.toHaveBeenCalled();
	});
});
