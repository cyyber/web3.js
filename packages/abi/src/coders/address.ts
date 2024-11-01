"use strict";

import { getAddress } from "@ethersproject/address";
import { hexZeroPad } from "@ethersproject/bytes";

import { Coder, Reader, Writer } from "./abstract-coder";

export class AddressCoder extends Coder {

    constructor(localName: string) {
        super("address", "address", localName, false);
    }

    defaultValue(): string {
        return "0x0000000000000000000000000000000000000000";
    }

    encode(writer: Writer, value: string): number {
        try {
            value = getAddress(value.replace('Z', '0x'))
        } catch (error: any) {
            this._throwError(error.message, value);
        }
        return writer.writeValue(value);
    }

    decode(reader: Reader): any {
        return getAddress(hexZeroPad(reader.readValue().toHexString(), 20)).replace('0x', 'Z');
    }
}

