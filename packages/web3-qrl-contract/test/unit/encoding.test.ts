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
import { AbiEventFragment, LogsInput } from '@theqrl/web3-types';
import { decodeEventABI } from '../../src/encoding';
import { decodeEventABIData } from '../fixtures/encoding';

describe('encoding decoding functions', () => {
	describe('decode', () => {
		describe('decodeEventABI', () => {
			it.each(decodeEventABIData)(
				'should decode %s',
				(
					_title: string,
					event: AbiEventFragment & { signature: string },
					inputs: LogsInput,
					output,
				) => {
					// `toBe` compares object identity and could never have passed here; the rest
					// of the suite compares decoded logs with `toStrictEqual`, which also holds
					// the fixtures to the `signature: undefined` key an anonymous log carries.
					expect(decodeEventABI(event, inputs, [])).toStrictEqual(output);
				},
			);
		});
	});
});
