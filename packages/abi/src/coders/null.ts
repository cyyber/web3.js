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

import { Coder, Reader, Writer } from './abstract-coder.js';

export class NullCoder extends Coder {
	constructor(localName: string) {
		super('null', '', localName, false);
	}

	defaultValue(): null {
		return null;
	}

	encode(writer: Writer, value: any): number {
		if (value != null) {
			this._throwError('not null', value);
		}
		return writer.writeBytes([]);
	}

	decode(reader: Reader): any {
		reader.readBytes(0);
		return reader.coerce(this.name, null);
	}
}
