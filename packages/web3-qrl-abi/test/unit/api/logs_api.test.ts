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

import { decodeLog } from '../../../src/api/logs_api';
import { encodeParameter } from '../../../src/api/parameters_api';
import { validDecodeLogsData } from '../../fixtures/data';

describe('logs_api', () => {
	describe('decodeLog', () => {
		describe('valid data', () => {
			it.each(validDecodeLogsData)(
				'should pass for valid values: %j',
				({ input: { abi, data, topics }, output }) => {
					const expected = decodeLog(abi, data, topics);
					expect(JSON.parse(JSON.stringify(expected))).toEqual(output);
				},
			);
		});

		it('requires exactly one VM64 topic per indexed input', () => {
			const input = [{ indexed: true, name: 'value', type: 'uint256' }];
			const topic = encodeParameter('uint256', 7);

			expect(decodeLog(input, '0x', [topic])).toMatchObject({ value: BigInt(7) });
			expect(() => decodeLog(input, '0x', [])).toThrow(
				'Indexed topic count mismatch: expected 1, got 0',
			);
			expect(() => decodeLog(input, '0x', [topic, topic])).toThrow(
				'Indexed topic count mismatch: expected 1, got 2',
			);
		});

		it('rejects short and non-canonical integer topics', () => {
			const input = [{ indexed: true, name: 'value', type: 'uint256' }];

			expect(() => decodeLog(input, '0x', [`0x${'0'.repeat(63)}1`])).toThrow(
				'expected 64 bytes',
			);
			expect(() => decodeLog(input, '0x', [`0x01${'00'.repeat(62)}01`])).toThrow(
				'non-canonical value',
			);
		});

		it('rejects a non-canonical indexed hash topic', () => {
			const input = [{ indexed: true, name: 'value', type: 'string' }];
			const canonical = `0x${'ab'.repeat(32)}${'00'.repeat(32)}`;

			expect(decodeLog(input, '0x', [canonical])).toMatchObject({ value: canonical });
			expect(() => decodeLog(input, '0x', [`0x${'ab'.repeat(64)}`])).toThrow(
				'Non-canonical indexed hash topic',
			);
		});
	});
});
