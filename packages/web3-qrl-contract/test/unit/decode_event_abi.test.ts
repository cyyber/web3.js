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
	address: '',
	data: '0x',
	topics,
});

describe('decodeEventABI VM64 topics', () => {
	it('verifies the signature and decodes exact indexed topics', () => {
		const decoded = decodeEventABI(
			event,
			log([signatureTopic, encodeParameter('uint256', 7)]),
			[event],
		);

		expect(decoded.event).toBe('Value');
		expect(decoded.signature).toBe(signatureTopic);
		expect(decoded.returnValues.value).toBe(BigInt(7));
	});

	it('matches and decodes raw hex topics when the output format uses byte arrays', () => {
		const valueTopic = encodeParameter('uint256', 7);
		const decoded = decodeEventABI(
			event,
			log([signatureTopic, valueTopic]),
			[event],
			{ number: FMT_NUMBER.BIGINT, bytes: FMT_BYTES.UINT8ARRAY },
		);

		expect(decoded.topics[0]).toBeInstanceOf(Uint8Array);
		expect(decoded.signature).toBe(signatureTopic);
		expect(decoded.raw?.topics).toEqual([signatureTopic, valueTopic]);
		expect(decoded.returnValues.value).toBe(BigInt(7));
	});

	it('rejects mismatched signatures and topic counts', () => {
		expect(() =>
			decodeEventABI(event, log([`0x${'ab'.repeat(64)}`, encodeParameter('uint256', 7)]), [
				event,
			]),
		).toThrow('Event signature does not match');
		expect(() => decodeEventABI(event, log([signatureTopic]), [event])).toThrow(
			'Event topic count mismatch',
		);
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

	it('supports an anonymous event with zero topics', () => {
		const anonymous = {
			type: 'event',
			name: 'Anonymous',
			anonymous: true,
			inputs: [],
			signature,
		} as AbiEventFragment & { signature: string };

		expect(decodeEventABI(anonymous, log([]), [anonymous]).event).toBe('Anonymous');
	});
});
