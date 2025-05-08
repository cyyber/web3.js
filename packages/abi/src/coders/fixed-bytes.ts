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

import { arrayify, BytesLike, hexlify } from '@ethersproject/bytes';

import { Coder, Reader, Writer } from './abstract-coder.js';

// @TODO: Merge this with bytes
export class FixedBytesCoder extends Coder {
	readonly size: number;

	constructor(size: number, localName: string) {
		const name = `bytes${String(size)}`;
		super(name, name, localName, false);
		this.size = size;
	}

	defaultValue(): string {
		return '0x0000000000000000000000000000000000000000000000000000000000000000'.substring(
			0,
			2 + this.size * 2,
		);
	}

	encode(writer: Writer, value: BytesLike): number {
		const data = arrayify(value);
		if (data.length !== this.size) {
			this._throwError('incorrect data length', value);
		}
		return writer.writeBytes(data);
	}

	decode(reader: Reader): any {
		return reader.coerce(this.name, hexlify(reader.readBytes(this.size)));
	}
}
