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
import { pack, unpack } from './array.js';

export class TupleCoder extends Coder {
	readonly coders: Array<Coder>;

	constructor(coders: Array<Coder>, localName: string) {
		let dynamic = false;
		const types: Array<string> = [];
		coders.forEach(coder => {
			if (coder.dynamic) {
				dynamic = true;
			}
			types.push(coder.type);
		});
		const type = `tuple(${types.join(',')})`;

		super('tuple', type, localName, dynamic);
		this.coders = coders;
	}

	defaultValue(): any {
		const values: any = [];
		this.coders.forEach(coder => {
			values.push(coder.defaultValue());
		});

		// We only output named properties for uniquely named coders
		const uniqueNames = this.coders.reduce<{ [name: string]: number }>((accum, coder) => {
			const name = coder.localName;
			if (name) {
				if (!accum[name]) {
					accum[name] = 0;
				}
				accum[name]++;
			}
			return accum;
		}, {});

		// Add named values
		this.coders.forEach((coder: Coder, index: number) => {
			let name = coder.localName;
			if (!name || uniqueNames[name] !== 1) {
				return;
			}

			if (name === 'length') {
				name = '_length';
			}

			if (values[name] != null) {
				return;
			}

			values[name] = values[index];
		});

		return Object.freeze(values);
	}

	encode(writer: Writer, value: Array<any> | { [name: string]: any }): number {
		return pack(writer, this.coders, value);
	}

	decode(reader: Reader): any {
		return reader.coerce(this.name, unpack(reader, this.coders));
	}
}
