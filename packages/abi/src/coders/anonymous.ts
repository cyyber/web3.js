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

// Clones the functionality of an existing Coder, but without a localName
export class AnonymousCoder extends Coder {
	private readonly coder: Coder;

	constructor(coder: Coder) {
		super(coder.name, coder.type, undefined, coder.dynamic);
		this.coder = coder;
	}

	defaultValue(): any {
		return this.coder.defaultValue();
	}

	encode(writer: Writer, value: any): number {
		return this.coder.encode(writer, value);
	}

	decode(reader: Reader): any {
		return this.coder.decode(reader);
	}
}
