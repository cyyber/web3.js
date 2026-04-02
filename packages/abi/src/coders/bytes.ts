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

import { arrayify, hexlify } from '@ethersproject/bytes';

import { Coder, Reader, Writer } from './abstract-coder.js';

export class DynamicBytesCoder extends Coder {
	constructor(type: string, localName: string) {
		super(type, type, localName, true);
	}

	defaultValue(): string {
		return '0x';
	}

	encode(writer: Writer, value: any): number {
		value = arrayify(value);
		let length = writer.writeValue(value.length);
		length += writer.writeBytes(value);
		return length;
	}

	decode(reader: Reader): any {
		return reader.readBytes(reader.readValue().toNumber(), true);
	}
}

export class BytesCoder extends DynamicBytesCoder {
	constructor(localName: string) {
		super('bytes', localName);
	}

	decode(reader: Reader): any {
		return reader.coerce(this.name, hexlify(super.decode(reader)));
	}
}
