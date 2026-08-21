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
import { ContractAbiWithSignature, decodeEventABI } from '../../src';

// A log exactly as a node serializes it: every topic is a full 64-byte VM64 word. The three
// indexed arguments cover the three distinct word layouts a node produces, and each carries an
// all-`ff` payload so that a truncation, a re-alignment or a stray pad cannot go unnoticed.
//
//   address  fills the word exactly (go-qrl `common.AddressToLogTopic`)
//   bytes32  occupies the HIGH 32 bytes (go-qrl `common.BytesToLeftAlignedLogTopic`)
//   uint256  occupies the LOW 32 bytes (go-qrl `common.BytesToRightAlignedLogTopic`)
const ZERO_HALF = '0'.repeat(64);
const FF_HALF = 'ff'.repeat(32);

// keccak256('FullWidthIndexedEvent(address,bytes32,uint256)'), left-aligned in a 64-byte topic
const eventSignature = `0x97c5ccfdf7b4e603439018c6dd07f746b27292edb629a88b9cec2beaa515dc5b${ZERO_HALF}`;
const addressTopic = `0x${'ff'.repeat(64)}`;
const bytes32Topic = `0x${FF_HALF}${ZERO_HALF}`;
const uint256Topic = `0x${ZERO_HALF}${FF_HALF}`;

const fullWidthEventFragment: AbiEventFragment & { signature: string } = {
	anonymous: false,
	inputs: [
		{ indexed: true, internalType: 'address', name: 'addr', type: 'address' },
		{ indexed: true, internalType: 'bytes32', name: 'raw', type: 'bytes32' },
		{ indexed: true, internalType: 'uint256', name: 'num', type: 'uint256' },
	],
	name: 'FullWidthIndexedEvent',
	type: 'event',
	signature: eventSignature,
};

const fullWidthLog: LogsInput = {
	address: `Q${'0'.repeat(126)}ab`,
	blockHash: `0x${'11'.repeat(32)}`,
	blockNumber: '0x14',
	data: '0x',
	logIndex: '0x0',
	transactionHash: `0x${'22'.repeat(32)}`,
	transactionIndex: '0x0',
	topics: [eventSignature, addressTopic, bytes32Topic, uint256Topic],
};

const jsonInterface = [fullWidthEventFragment] as unknown as ContractAbiWithSignature;

describe('decodeEventABI', () => {
	describe('full-width indexed topics', () => {
		it('should decode an address topic that fills the whole word', () => {
			const decoded = decodeEventABI(fullWidthEventFragment, fullWidthLog, jsonInterface);

			expect(decoded.returnValues.addr).toBe(`Q${'ff'.repeat(64)}`);
		});

		it('should return a bytes32 topic as the verbatim 64-byte word', () => {
			const decoded = decodeEventABI(fullWidthEventFragment, fullWidthLog, jsonInterface);

			expect(decoded.returnValues.raw).toBe(bytes32Topic);
		});

		it('should decode a right-aligned uint256 topic to the maximum value', () => {
			const decoded = decodeEventABI(fullWidthEventFragment, fullWidthLog, jsonInterface);

			expect(decoded.returnValues.num).toBe(BigInt(2) ** BigInt(256) - BigInt(1));
		});

		it('should resolve the event and preserve the raw topics untouched', () => {
			const decoded = decodeEventABI(fullWidthEventFragment, fullWidthLog, jsonInterface);

			expect(decoded.event).toBe('FullWidthIndexedEvent');
			expect(decoded.signature).toBe(eventSignature);
			expect(decoded.raw?.topics).toStrictEqual([
				eventSignature,
				addressTopic,
				bytes32Topic,
				uint256Topic,
			]);
		});

		it('should match the event by its left-aligned signature topic for allEvents', () => {
			const decoded = decodeEventABI(
				{ ...fullWidthEventFragment, name: 'ALLEVENTS' },
				fullWidthLog,
				jsonInterface,
			);

			expect(decoded.event).toBe('FullWidthIndexedEvent');
			expect(decoded.returnValues.addr).toBe(`Q${'ff'.repeat(64)}`);
		});
	});
});
