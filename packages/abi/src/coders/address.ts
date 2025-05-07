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



import { getAddress } from '@ethersproject/address';
import { hexZeroPad } from '@ethersproject/bytes';
import { hexToAddress, addressToHex } from '@theqrl/web3-utils';

import { Coder, Reader, Writer } from './abstract-coder.js';

export class AddressCoder extends Coder {
	constructor(localName: string) {
		super('address', 'address', localName, false);
	}

	defaultValue(): string {
		return 'Z0000000000000000000000000000000000000000';
	}

	encode(writer: Writer, value: string): number {
		try {
			value = getAddress(addressToHex(value));
		} catch (error: any) {
			this._throwError(error.message, value);
		}
		return writer.writeValue(value);
	}

	decode(reader: Reader): any {
		return hexToAddress(getAddress(hexZeroPad(reader.readValue().toHexString(), 20)));
	}
}
