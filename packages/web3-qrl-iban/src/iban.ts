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

import { HexString } from '@theqrl/web3-types';
import { isAddressString } from '@theqrl/web3-validator';
import { InvalidAddressError } from '@theqrl/web3-errors';
import { IbanOptions } from './types.js';

/**
 * Converts QRL addresses to IBAN or BBAN addresses and vice versa.
 */
export class Iban {
	private readonly _iban: string;

	/**
	 * Prepare an IBAN for mod 97 computation by moving the first 4 chars to the end and transforming the letters to
	 * numbers (A = 10, B = 11, ..., Z = 35), as specified in ISO13616.
	 */
	private static readonly _iso13616Prepare = (iban: string): string => {
		const A = 'A'.charCodeAt(0);
		const Z = 'Z'.charCodeAt(0);

		const upperIban = iban.toUpperCase();
		const modifiedIban = `${upperIban.slice(4)}${upperIban.slice(0, 4)}`;

		return modifiedIban
			.split('')
			.map(n => {
				const code = n.charCodeAt(0);
				if (code >= A && code <= Z) {
					// A = 10, B = 11, ... Z = 35
					return code - A + 10;
				}
				return n;
			})
			.join('');
	};

	/**
	 * Calculates the MOD 97 10 of the passed IBAN as specified in ISO7064.
	 */
	private static readonly _mod9710 = (iban: string): number => {
		let remainder = iban;
		let block;

		while (remainder.length > 2) {
			block = remainder.slice(0, 9);
			remainder = `${(parseInt(block, 10) % 97).toString()}${remainder.slice(block.length)}`;
		}

		return parseInt(remainder, 10) % 97;
	};

	/**
	 * A static method that checks if an IBAN is Direct.
	 * It actually check the length of the provided variable and, only if it is 34 or 35, it returns true.
	 * Note: this is also available as a method at an Iban instance.
	 * @param iban - an IBAN to be checked
	 * @returns - `true` if the provided `iban` is a Direct IBAN, and `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.isDirect("XE81ETHXREGGAVOFYORK");
	 * > false
	 * ```
	 */
	public static isDirect(iban: string): boolean {
		return iban.length === 34 || iban.length === 35;
	}

	/**
	 * An instance method that checks if iban number is Direct.
	 * It actually check the length of the provided variable and, only if it is 34 or 35, it returns true.
	 * Note: this is also available as a static method.
	 * @param iban - an IBAN to be checked
	 * @returns - `true` if the provided `iban` is a Direct IBAN, and `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE81ETHXREGGAVOFYORK");
	 * iban.isDirect();
	 * > false
	 * ```
	 */
	public isDirect(): boolean {
		return Iban.isDirect(this._iban);
	}

	/**
	 * A static method that checks if an IBAN is Indirect.
	 * It actually check the length of the provided variable and, only if it is 20, it returns true.
	 * Note: this is also available as a method at an Iban instance.
	 * @param iban - an IBAN to be checked
	 * @returns - `true` if the provided `iban` is an Indirect IBAN, and `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.isIndirect("XE81ETHXREGGAVOFYORK");
	 * > true
	 * ```
	 */
	public static isIndirect(iban: string): boolean {
		return iban.length === 20;
	}

	/**
	 * check if iban number if indirect
	 * It actually check the length of the provided variable and, only if it is 20, it returns true.
	 * Note: this is also available as a static method.
	 * @param iban - an IBAN to be checked
	 * @returns - `true` if the provided `iban` is an Indirect IBAN, and `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE81ETHXREGGAVOFYORK");
	 * iban.isIndirect();
	 * > true
	 * ```
	 */
	public isIndirect(): boolean {
		return Iban.isIndirect(this._iban);
	}

	/**
	 * This method could be used to check if a given string is valid IBAN object.
	 * Note: this is also available as a method at an Iban instance.
	 *
	 * @param iban - a string to be checked if it is in IBAN
	 * @returns - true if it is valid IBAN
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.isValid("XE81ETHXREGGAVOFYORK");
	 * > true
	 *
	 * web3.qrl.Iban.isValid("XE82ETHXREGGAVOFYORK");
	 * > false // because the checksum is incorrect
	 * ```
	 */
	public static isValid(iban: string) {
		return (
			/^XE[0-9]{2}(ETH[0-9A-Z]{13}|[0-9A-Z]{30,31})$/.test(iban) &&
			Iban._mod9710(Iban._iso13616Prepare(iban)) === 1
		);
	}

	/**
	 * Should be called to check if the early provided IBAN is correct.
	 * Note: this is also available as a static method.
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE81ETHXREGGAVOFYORK");
	 * iban.isValid();
	 * > true
	 *
	 * const iban = new web3.qrl.Iban("XE82ETHXREGGAVOFYORK");
	 * iban.isValid();
	 * > false // because the checksum is incorrect
	 * ```
	 */
	public isValid(): boolean {
		return Iban.isValid(this._iban);
	}

	/**
	 * Construct a direct or indirect IBAN that has conversion methods and validity checks.
	 * If the provided string was not of either the length of a direct IBAN (34 or 35),
	 * nor the length of an indirect IBAN (20), an Error will be thrown ('Invalid IBAN was provided').
	 *
	 * @param iban - a Direct or an Indirect IBAN
	 * @returns - Iban instance
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS");
	 * > Iban { _iban: 'XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS' }
	 * ```
	 */
	public constructor(iban: string) {
		if (Iban.isIndirect(iban) || Iban.isDirect(iban)) {
			this._iban = iban;
		} else {
			throw new Error('Invalid IBAN was provided');
		}
	}

	/**
	 * Convert the passed BBAN to an IBAN for this country specification.
	 * Please note that <i>"generation of the IBAN shall be the exclusive responsibility of the bank/branch servicing the account"</i>.
	 * This method implements the preferred algorithm described in http://en.wikipedia.org/wiki/International_Bank_Account_Number#Generating_IBAN_check_digits
	 *
	 * @param bban - the BBAN to convert to IBAN
	 * @returns an Iban class instance that holds the equivalent IBAN
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.fromBban('ETHXREGGAVOFYORK');
	 * > Iban {_iban: "XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS"}
	 * ```
	 */
	public static fromBban(bban: string): Iban {
		const countryCode = 'XE';

		const remainder = this._mod9710(this._iso13616Prepare(`${countryCode}00${bban}`));
		const checkDigit = `0${(98 - remainder).toString()}`.slice(-2);

		return new Iban(`${countryCode}${checkDigit}${bban}`);
	}

	/**
	 * Should be used to create IBAN object for given institution and identifier
	 *
	 * @param options - an object holds the `institution` and the `identifier` which will be composed to create an `Iban` object from.
	 * @returns an Iban class instance that holds the equivalent IBAN
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.createIndirect({
	 *     institution: "XREG",
	 *     identifier: "GAVOFYORK"
	 * });
	 * > Iban {_iban: "XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS"}
	 * ```
	 */
	public static createIndirect(options: IbanOptions): Iban {
		return Iban.fromBban(`ETH${options.institution}${options.identifier}`);
	}

	/**
	 * This method should be used to create iban object from a QRL address.
	 *
	 * @param address - a QRL address
	 * @returns an Iban class instance that holds the equivalent IBAN
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.fromAddress("Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5496aee77c1ba1f0854206a26dda82a81d6d8");
	 * > Iban {_iban: "XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS"}
	 * ```
	 */
	public static fromAddress(address: HexString): Iban {
		if (!isAddressString(address)) {
			throw new InvalidAddressError(address);
		}

		// QIB scheme is not yet defined for 64-byte post-quantum addresses.
		//
		// The legacy QIB/ETH-style IBAN encodes a 20-byte address as a 30-char
		// base36 BBAN inside an ISO-13616 IBAN (max total length 34 chars).
		// A 64-byte address requires ~99 base36 chars and does not fit.
		//
		// Until QRL governance picks a post-quantum address-encoding scheme
		// (and the spec is published), this method is disabled.
		throw new Error(
			'Iban.fromAddress is not supported for 64-byte post-quantum addresses. ' +
				'The legacy IBAN scheme (max 34 chars, max 30 char BBAN ~= 20 byte address) ' +
				'cannot losslessly encode a 64-byte ML-DSA-87 address. ' +
				'Awaiting QRL governance decision on a post-quantum address-encoding scheme.',
		);
	}

	/**
	 * This method should be used to create a qrl address from a Direct IBAN address.
	 * If the provided string was not a direct IBAN (has the length of 34 or 35), an Error will be thrown:
	 * ('Iban is indirect and cannot be converted. Must be length of 34 or 35').
	 * Note: this is also available as a method at an Iban instance.
	 *
	 * @param iban - a Direct IBAN address
	 * @return the equivalent qrl address
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.toAddress("XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS");
	 * > "Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5496aee77c1ba1f0854206a26dda82a81d6d8"
	 * ```
	 */
	public static toAddress = (iban: string): HexString => {
		const ibanObject = new Iban(iban);
		return ibanObject.toAddress();
	};

	/**
	 * This method should be used to create the equivalent qrl address for the early provided Direct IBAN address.
	 * If the provided string was not a direct IBAN (has the length of 34 or 35), an Error will be thrown:
	 * ('Iban is indirect and cannot be converted. Must be length of 34 or 35').
	 * Note: this is also available as a static method.
	 *
	 * @return the equivalent qrl address
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS");
	 * iban.toAddress();
	 * > "Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5496aee77c1ba1f0854206a26dda82a81d6d8"
	 * ```
	 */
	public toAddress = (): HexString => {
		// Symmetric with Iban.fromAddress — see disabled-method comment there.
		// Even if a Direct IBAN is given, the 30-char base36 BBAN can encode at
		// most ~20 bytes of address data, which cannot be inflated back into
		// a 64-byte post-quantum address.
		throw new Error(
			'Iban.toAddress is not supported for 64-byte post-quantum addresses. ' +
				'The legacy IBAN scheme cannot losslessly decode to a 64-byte ML-DSA-87 address. ' +
				'Awaiting QRL governance decision on a post-quantum address-encoding scheme.',
		);
	};

	/**
 * This method should be used to create IBAN address from a QRL address
	 *
	 * @param address - a QRL address
	 * @return the equivalent IBAN address
	 *
	 * @example
	 * ```ts
	 * web3.qrl.Iban.toIban("Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5496aee77c1ba1f0854206a26dda82a81d6d8");
	 * > "XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS"
	 * ```
	 */
	public static toIban(address: HexString): string {
		return Iban.fromAddress(address).toString();
	}

	/**
	 * Should be called to get client identifier within institution
	 *
	 * @return the client of the IBAN instance.
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE81ETHXREGGAVOFYORK");
	 * iban.client();
	 * > 'GAVOFYORK'
	 * ```
	 */
	public client(): string {
		return this.isIndirect() ? this._iban.slice(11) : '';
	}

	/**
	 * Returns the IBAN checksum of the early provided IBAN
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE81ETHXREGGAVOFYORK");
	 * iban.checksum();
	 * > "81"
	 * ```
	 *
	 */
	public checksum(): string {
		return this._iban.slice(2, 4);
	}

	/**
	 * Returns institution identifier from the early provided  IBAN
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban("XE81ETHXREGGAVOFYORK");
	 * iban.institution();
	 * > 'XREG'
	 * ```
	 */
	public institution(): string {
		return this.isIndirect() ? this._iban.slice(7, 11) : '';
	}

	/**
	 * Simply returns the early provided IBAN
	 *
	 * @example
	 * ```ts
	 * const iban = new web3.qrl.Iban('XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS');
	 * iban.toString();
	 * > 'XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS'
	 * ```
	 */
	public toString(): string {
		return this._iban;
	}
}
