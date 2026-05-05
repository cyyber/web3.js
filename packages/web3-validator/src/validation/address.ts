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

/**
 * Checks the structural validity of a QRL address.
 * QRL 48-byte addresses do not embed a mixed-case checksum; input is
 * case-insensitive and canonical output is lowercase.
 */
export const checkAddressCheckSum = (data: string): boolean => {
	return /^Q[0-9a-f]{96}$/i.test(data);
};

/**
 * Checks if a given string is a valid QRL address.
 * `checkChecksum` is accepted for API compatibility and ignored because QRL
 * addresses do not include an EIP-55 style checksum.
 */
export const isAddressString = (value: string, checkChecksum = true) => {
	void checkChecksum;
	if (typeof value !== 'string') {
		return false;
	}

	return /^Q[0-9a-f]{96}$/i.test(value);
};
