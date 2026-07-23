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

		it('decodes fixed bytes and preserves dynamic indexed values', () => {
			const fixedBytes = `0x${'ab'.repeat(32)}`;
			const dynamicHash = `0x${'cd'.repeat(32)}${'0'.repeat(64)}`;
			const decoded = decodeLog(
				[
					{ indexed: true, name: 'fixedBytes', type: 'bytes32' },
					{ indexed: true, name: 'dynamicValue', type: 'string' },
				],
				'0x',
				[encodeParameter('bytes32', fixedBytes), dynamicHash],
			);

			expect(decoded.fixedBytes).toBe(fixedBytes);
			expect(decoded.dynamicValue).toBe(dynamicHash);
		});
	});
});
