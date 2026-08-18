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

import { sha3Raw } from '@theqrl/web3-utils';
import { isTopic } from '@theqrl/web3-validator';
import { encodeEventSignature } from '../../../src/api/events_api';
import { invalidEventsSignatures, validEventsSignatures } from '../../fixtures/data';

describe('events_api', () => {
	describe('encodeEventSignature', () => {
		describe('log topic alignment', () => {
			// A QRVM log topic is 64 bytes wide (go-qrl `common.LogTopicLength`) and a 32-byte
			// Keccak hash is left-aligned within it (go-qrl `common.HashToLogTopic`), so the
			// signature must be the hash followed by 64 hex characters of zero padding.
			const eventName = 'Transfer(address,address,uint256)';

			it('should return the event signature hash left-aligned in a 64-byte topic', () => {
				expect(encodeEventSignature(eventName)).toBe(
					`${sha3Raw(eventName)}${'0'.repeat(64)}`,
				);
			});

			it('should return a signature accepted as a topic by the validator', () => {
				const signature = encodeEventSignature(eventName);

				expect(signature).toHaveLength(130);
				expect(isTopic(signature)).toBe(true);
			});
		});

		describe('valid data', () => {
			it.each(validEventsSignatures)(
				'should pass for valid values: %s',
				({ input, output }) => {
					expect(encodeEventSignature(input)).toEqual(output);
				},
			);
		});
		describe('invalid data', () => {
			it.each(invalidEventsSignatures)(
				'should fail for invalid values: %s',
				({ input, output }) => {
					expect(() => encodeEventSignature(input)).toThrow(output);
				},
			);
		});
	});
});
