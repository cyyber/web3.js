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

import { isEip712TypedData } from '../../../src/validation/eip712';
import { validator } from '../../../src/default_validator';

// A minimal but complete EIP-712 payload. Every negative case below is this object with exactly
// one thing broken, so each test pins one precondition of `getEncodedEip712Data`.
const validTypedData = {
	types: {
		EIP712Domain: [
			{ name: 'name', type: 'string' },
			{ name: 'version', type: 'string' },
			{ name: 'chainId', type: 'uint256' },
		],
		Message: [{ name: 'contents', type: 'string' }],
	},
	primaryType: 'Message',
	domain: { name: 'QRL', version: '1', chainId: 1 },
	message: { contents: 'hello' },
};

const clone = () => JSON.parse(JSON.stringify(validTypedData)) as Record<string, any>;

describe('validation', () => {
	describe('isEip712TypedData', () => {
		it('should accept a well-formed typed data object', () => {
			expect(isEip712TypedData(validTypedData)).toBe(true);
		});

		// eslint-disable-next-line no-null/no-null
		it.each([undefined, null, 'string', 42, true, [], () => undefined])(
			'should reject a non-object value: %s',
			value => {
				expect(isEip712TypedData(value)).toBe(false);
			},
		);

		it('should reject when types is missing', () => {
			const data = clone();
			delete data.types;
			expect(isEip712TypedData(data)).toBe(false);
		});

		it('should reject when types is not a plain object', () => {
			const data = clone();
			data.types = [];
			expect(isEip712TypedData(data)).toBe(false);
		});

		// getMessage() reads types.EIP712Domain unconditionally to build the domain separator.
		it('should reject when types.EIP712Domain is missing', () => {
			const data = clone();
			delete data.types.EIP712Domain;
			expect(isEip712TypedData(data)).toBe(false);
		});

		it('should reject when types.EIP712Domain is not an array', () => {
			const data = clone();
			data.types.EIP712Domain = {};
			expect(isEip712TypedData(data)).toBe(false);
		});

		it('should reject a type member that is not an object', () => {
			const data = clone();
			data.types.Message = ['contents'];
			expect(isEip712TypedData(data)).toBe(false);
		});

		it.each(['name', 'type'])('should reject a type member missing %s', field => {
			const data = clone();
			delete data.types.Message[0][field];
			expect(isEip712TypedData(data)).toBe(false);
		});

		it.each(['name', 'type'])('should reject a type member whose %s is empty', field => {
			const data = clone();
			data.types.Message[0][field] = '';
			expect(isEip712TypedData(data)).toBe(false);
		});

		it.each(['name', 'type'])('should reject a type member whose %s is not a string', field => {
			const data = clone();
			data.types.Message[0][field] = 42;
			expect(isEip712TypedData(data)).toBe(false);
		});

		it.each([undefined, '', 42, {}])('should reject primaryType: %s', primaryType => {
			const data = clone();
			data.primaryType = primaryType;
			expect(isEip712TypedData(data)).toBe(false);
		});

		// encodeData() does types[primaryType].reduce(...) — an undeclared primaryType is the
		// classic opaque "Cannot read properties of undefined (reading 'reduce')".
		it('should reject a primaryType that is not declared in types', () => {
			const data = clone();
			data.primaryType = 'NotDeclared';
			expect(isEip712TypedData(data)).toBe(false);
		});

		it.each(['domain', 'message'])('should reject when %s is missing', field => {
			const data = clone();
			delete data[field];
			expect(isEip712TypedData(data)).toBe(false);
		});

		it.each(['domain', 'message'])('should reject when %s is not a plain object', field => {
			const data = clone();
			data[field] = 'not-an-object';
			expect(isEip712TypedData(data)).toBe(false);
		});

		// Provider extension fields are permitted: the wallet's ingest ignores unknown keys, so
		// rejecting them here would diverge from the only real implementation.
		it('should accept unknown top-level keys', () => {
			const data = clone();
			data.someProviderExtension = { anything: true };
			expect(isEip712TypedData(data)).toBe(true);
		});
	});

	// The format registration is what actually makes the guard fire from `validator.validate`.
	// Without this, `isEip712TypedData` would be correct but never called — an inert control.
	describe('eip712TypedData format wiring', () => {
		it('should pass validation for well-formed typed data', () => {
			expect(() =>
				validator.validate(['eip712TypedData'], [validTypedData]),
			).not.toThrow();
		});

		it('should throw Web3ValidatorError for malformed typed data', () => {
			const data = clone();
			delete data.types.EIP712Domain;
			expect(() => validator.validate(['eip712TypedData'], [data])).toThrow();
		});
	});
});
