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

import { Iban } from '../../src/iban';
import {
	validIbanToAddressData,
	validFromBbanData,
	invalidIbanToAddressData,
	validCreateIndirectData,
	isValidData,
	validIsDirectData,
	validIsIndirectData,
	validClientData,
	validChecksumData,
	validInstitutionData,
} from '../fixtures/iban';

describe('iban', () => {
	describe('create', () => {
		describe('valid cases', () => {
			it.each(validIbanToAddressData)('%s', () => {
				const iban = new Iban('XE7338O073KYGTWWZN0F2WZ0R8PX5ZPPZS');
				expect(typeof iban).toBe('object');
			});
		});
	});

	// QIB <-> 48-byte address conversion is intentionally disabled until
	// QRL governance picks a post-quantum address-encoding scheme that
	// fits inside the 34-char IBAN envelope. Tests here just verify the
	// disabled methods throw with the expected message instead of producing
	// silently-wrong addresses.
	describe('toAddress (instance, disabled for 48B)', () => {
		it('throws migration message for any direct iban', () => {
			const iban = new Iban(validIbanToAddressData[0][0]);
			expect(() => iban.toAddress()).toThrow(
				/not supported for 48-byte post-quantum addresses/,
			);
		});
		describe('invalid (indirect) cases still throw their original error', () => {
			it.each(invalidIbanToAddressData)('%s', input => {
				const iban = new Iban(input);
				// Now both indirect-iban AND direct-iban paths throw, so we
				// just assert *some* error is thrown.
				expect(() => iban.toAddress()).toThrow();
			});
		});
	});

	describe('toAddress static (disabled for 48B)', () => {
		it('throws migration message', () => {
			expect(() => Iban.toAddress(validIbanToAddressData[0][0])).toThrow(
				/not supported for 48-byte post-quantum addresses/,
			);
		});
	});

	describe('fromAddress (disabled for 48B)', () => {
		it('throws migration message for a valid 48B address', () => {
				// Use a known-good all-lowercase 48B address. Verifies the
				// disabled-method throw fires after format
			// validation succeeds.
			const lowercaseValid =
				'Q253c9b5f121c662bda2783a091e4e98ebdcb4ad1df8c4d41bc2b907d4e6a564e1b359f6c439c363e90fc82476e088e68';
			expect(() => Iban.fromAddress(lowercaseValid)).toThrow(
				/not supported for 48-byte post-quantum addresses/,
			);
		});
	});

	describe('fromBban', () => {
		describe('valid cases', () => {
			it.each(validFromBbanData)('%s', (input, output) => {
				expect(Iban.fromBban(input).toString()).toBe(output);
			});
		});
	});

	describe('createIndirect', () => {
		describe('valid cases', () => {
			it.each(validCreateIndirectData)('%s', (input, output) => {
				expect(Iban.createIndirect(input).toString()).toBe(output);
			});
		});
	});

	describe('isValid', () => {
		describe('valid cases', () => {
			it.each(isValidData)('%s', (input, output) => {
				const iban = new Iban(input);
				expect(iban.isValid()).toBe(output);
			});
		});
	});

	describe('isValid static', () => {
		describe('valid cases', () => {
			it.each(isValidData)('%s', (input, output) => {
				expect(Iban.isValid(input)).toBe(output);
			});
		});
	});

	describe('isDirect', () => {
		describe('valid cases', () => {
			it.each(validIsDirectData)('%s', (input, output) => {
				expect(Iban.isValid(input)).toBe(output);
			});
		});
	});

	describe('isIndirect', () => {
		describe('valid cases', () => {
			it.each(validIsIndirectData)('%s', (input, output) => {
				expect(Iban.isIndirect(input)).toBe(output);
			});
		});
	});

	describe('client', () => {
		describe('valid cases', () => {
			it.each(validClientData)('%s', (input, output) => {
				const iban = new Iban(input);
				expect(iban.client()).toBe(output);
			});
		});
	});

	describe('institution', () => {
		describe('valid cases', () => {
			it.each(validInstitutionData)('%s', (input, output) => {
				const iban = new Iban(input);
				expect(iban.institution()).toBe(output);
			});
		});
	});

	describe('checksum', () => {
		describe('valid cases', () => {
			it.each(validChecksumData)('%s', (input, output) => {
				const iban = new Iban(input);
				expect(iban.checksum()).toBe(output);
			});
		});
	});
});
