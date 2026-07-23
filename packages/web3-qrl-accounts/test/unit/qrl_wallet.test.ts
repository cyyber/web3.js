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

import {
	getMLDSA87SigningContext,
	newMLDSA87WalletFromExtendedSeed,
	signMLDSA87Message,
	verifyMLDSA87Signature,
} from '../../src/qrl_wallet';
import { validSeedtoAccountData } from '../fixtures/account';

describe('ML-DSA-87 signing context', () => {
	it('binds the Zond context version to the address descriptor', () => {
		expect(getMLDSA87SigningContext(Uint8Array.from([1, 0, 0]))).toEqual(
			Uint8Array.from([0x5a, 0x4f, 0x4e, 0x44, 0x01, 0x01, 0x00, 0x00]),
		);
	});

	it('can sign repeatedly and verify with the descriptor-bound context', () => {
		const wallet = newMLDSA87WalletFromExtendedSeed(validSeedtoAccountData[0][0].address);
		const message = Uint8Array.from([1, 2, 3]);
		const descriptor = wallet.getDescriptor().toBytes();
		const signature = signMLDSA87Message(wallet, message);

		expect(signMLDSA87Message(wallet, message)).toEqual(signature);
		expect(verifyMLDSA87Signature(signature, message, wallet.getPK(), descriptor)).toBe(true);
		expect(
			verifyMLDSA87Signature(
				signature,
				message,
				wallet.getPK(),
				Uint8Array.from([1, 0, 1]),
			),
		).toBe(false);
	});
});
