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
import { AbiEventFragment, FMT_BYTES, FMT_NUMBER, LogsInput } from '@theqrl/web3-types';
import { encodeParameter } from '@theqrl/web3-qrl-abi';
import { decodeEventABI } from '../../src/encoding';

const signature = '0xdd64d7f331676de21d95ea9f7eb8585b688f72afec29a51ff4502fd5a6ae19e7';
const signatureTopic = `${signature}${'0'.repeat(64)}`;
const event: AbiEventFragment & { signature: string } = {
	type: 'event',
	name: 'Value',
	inputs: [{ indexed: true, name: 'value', type: 'uint256' }],
	signature,
};

const log = (topics: string[]): LogsInput => ({
	address:
		'Qd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72',
	data: '0x',
	topics,
});

describe('decodeEventABI VM64 topics', () => {
	it('decodes a named event with a full-width signature topic', () => {
		const decoded = decodeEventABI(
			event,
			log([signatureTopic, encodeParameter('uint256', 7)]),
			[event],
		);

		expect(decoded.event).toBe('Value');
		expect(decoded.signature).toBe(signatureTopic);
		expect(decoded.returnValues.value).toBe(BigInt(7));
	});

	it('matches allEvents against the serialized VM64 signature', () => {
		const allEvents = {
			type: 'event',
			name: 'ALLEVENTS',
			signature,
		} as AbiEventFragment & { signature: string };
		const decoded = decodeEventABI(
			allEvents,
			log([signatureTopic, encodeParameter('uint256', 7)]),
			[event],
		);

		expect(decoded.event).toBe('Value');
		expect(decoded.returnValues.value).toBe(BigInt(7));
	});

	it('keeps raw topics as hex when formatted topics use byte arrays', () => {
		const valueTopic = encodeParameter('uint256', 7);
		const decoded = decodeEventABI(event, log([signatureTopic, valueTopic]), [event], {
			number: FMT_NUMBER.BIGINT,
			bytes: FMT_BYTES.UINT8ARRAY,
		});

		expect(decoded.topics[0]).toBeInstanceOf(Uint8Array);
		expect(decoded.raw?.topics).toEqual([signatureTopic, valueTopic]);
	});

	it('returns an unknown allEvents log without crashing', () => {
		const allEvents = {
			type: 'event',
			name: 'ALLEVENTS',
			signature,
		} as AbiEventFragment & { signature: string };
		const topic = `0x${'ab'.repeat(64)}`;
		const decoded = decodeEventABI(allEvents, log([topic]), []);

		expect(decoded.event).toBeUndefined();
		expect(decoded.signature).toBeUndefined();
		expect(decoded.raw?.topics).toEqual([topic]);
	});
});
