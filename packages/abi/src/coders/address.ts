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

import { hexZeroPad } from '@ethersproject/bytes';
import { hexToAddress, addressToHex } from '@theqrl/web3-utils';

import { Coder, Reader, Writer } from './abstract-coder.js';

// Q + 96 hex chars; addressToHex returns "0x" + 96 hex chars.
const ADDRESS_HEX_LENGTH = 2 + 48 * 2;

export class AddressCoder extends Coder {
	constructor(localName: string) {
		super('address', 'address', localName, false);
	}

	defaultValue(): string {
		return 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
	}

	encode(writer: Writer, value: string): number {
		// addressToHex validates that `value` is a well-formed 48-byte Q-prefixed
		// address and returns the same bytes as a 0x-prefixed hex string. We
		// deliberately do NOT route through `@ethersproject/address.getAddress`:
		// ethers' validator hard-codes the 20-byte ETH layout and rejects 48-byte
		// post-quantum addresses with "invalid address (version=address/5.7.0)".
		let hex: string;
		try {
			hex = addressToHex(value);
		} catch (error: any) {
			this._throwError(error.message, value);
			throw error; // unreachable; satisfies the type checker
		}
		if (hex.length !== ADDRESS_HEX_LENGTH) {
			this._throwError(`invalid 48-byte address (got ${(hex.length - 2) / 2} bytes)`, value);
		}
		// writeValue left-pads the 48-byte value into a 64-byte VM word, matching
		// how the chain stores addresses in storage and event topics.
		return writer.writeValue(hex);
	}

	decode(reader: Reader): any {
		// readValue returns a 64-byte word as a BigNumber; the address occupies
		// the rightmost 48 bytes. hexZeroPad re-trims to the canonical width.
		return hexToAddress(hexZeroPad(reader.readValue().toHexString(), 48));
	}
}
