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

import { bytesToHex, hexToBytes } from '@theqrl/web3-utils';
import {
	addressFromPublicKeyAndDescriptor,
	newMLDSA87WalletFromExtendedSeed,
	verifyMLDSA87Signature,
} from '../../src/qrl_wallet';
import { seedToAccount } from '../../src/account';
import { mldsa87WalletVectors } from '../fixtures/mldsa87_kat_vectors';

/*
 * Known-answer tests for this package's ML-DSA-87 integration.
 *
 * The ML-DSA-87 primitive itself is externally audited and is covered by KATs
 * upstream; these tests do not re-test the primitive. They assert that *this*
 * repository wires it up correctly — in particular that
 * `addressFromPublicKeyAndDescriptor` (src/qrl_wallet.ts), which is web3.js's
 * own re-implementation of `SHAKE256(descriptor || pk, dkLen = 64)`, and the
 * `seedToAccount` pipeline (src/account.ts) that layers web3-utils'
 * `toChecksumAddress` on top of it, agree byte-for-byte with theQRL/go-qrllib
 * and theQRL/wallet.js.
 *
 * See test/fixtures/mldsa87_kat_vectors.ts for vector provenance. Expected
 * values are copied from upstream and must never be regenerated from this
 * repository's own output.
 */
describe('ML-DSA-87 known-answer tests', () => {
	const hex = (value: string) => hexToBytes(`0x${value}`);

	it('has vectors to run', () => {
		expect(mldsa87WalletVectors).toHaveLength(5);
	});

	describe.each(mldsa87WalletVectors)(
		'$name',
		({ message, extendedSeed, wantAddress, wantChecksumAddress, wantPK, wantSignature }) => {
			// Guards the vector file itself: these are the QRL wire sizes, so a
			// truncated or mistranscribed vector fails loudly here rather than
			// silently weakening the assertions below.
			it('vector has the expected QRL wire sizes', () => {
				expect(hex(extendedSeed)).toHaveLength(51);
				expect(hex(wantPK)).toHaveLength(2592);
				expect(hex(wantSignature)).toHaveLength(4627);
				expect(wantAddress).toMatch(/^Q[0-9a-f]{128}$/);
				expect(wantChecksumAddress.toLowerCase()).toBe(wantAddress.toLowerCase());
			});

			// Proves: extendedSeed -> SHA256(seed) -> ML-DSA-87 KeyGen -> pk
			// produces the public key that go-qrllib and wallet.js both produce.
			it('derives the expected public key from the extended seed', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));

				expect(bytesToHex(wallet.getPK())).toBe(`0x${wantPK}`);
			});

			// Proves: this repo's own SHAKE256(descriptor || pk, 64) matches the
			// upstream address derivation. This is the assertion the audit
			// finding was really about — addressFromPublicKeyAndDescriptor is
			// web3.js code, not a call into wallet.js.
			it('derives the expected address via addressFromPublicKeyAndDescriptor', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));
				const address = addressFromPublicKeyAndDescriptor(
					wallet.getPK(),
					wallet.getDescriptor(),
				);

				expect(bytesToHex(address).replace('0x', 'Q')).toBe(wantAddress);
			});

			// Cross-check: our derivation agrees with upstream's own getAddressStr().
			it('agrees with the upstream wallet address string', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));

				expect(wallet.getAddressStr()).toBe(wantAddress);
			});

			// Proves the full public entry point: seedToAccount() runs our
			// derivation and then web3-utils' toChecksumAddress. The expected
			// value is go-qrllib's cross-implementation parity vector, so this
			// pins the EIP-55-style checksum too.
			it('seedToAccount returns the expected checksummed address', () => {
				const account = seedToAccount(hex(extendedSeed));

				expect(account.address).toBe(wantChecksumAddress);
			});

			// Proves our verify wiring passes the descriptor-bound signing
			// context correctly: the vector signature is a real FIPS 204 3.5
			// deterministic signature produced by go-qrllib / wallet.js, and it
			// must verify under our verify path.
			it('verifies the upstream deterministic signature vector', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));
				const verified = verifyMLDSA87Signature(
					hex(wantSignature),
					Buffer.from(message, 'utf8'),
					hex(wantPK),
					wallet.getDescriptor(),
				);

				expect(verified).toBe(true);
			});

			it('rejects a tampered signature', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));
				const tampered = hex(wantSignature);
				tampered[0] ^= 0xff;

				expect(
					verifyMLDSA87Signature(
						tampered,
						Buffer.from(message, 'utf8'),
						hex(wantPK),
						wallet.getDescriptor(),
					),
				).toBe(false);
			});

			it('rejects a signature over a different message', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));

				expect(
					verifyMLDSA87Signature(
						hex(wantSignature),
						Buffer.from(`${message} (tampered)`, 'utf8'),
						hex(wantPK),
						wallet.getDescriptor(),
					),
				).toBe(false);
			});

			// wallet.sign() is hedged (FIPS 204 3.4, TOB-QRLLIB-6), so its output
			// cannot be byte-compared against wantSignature. Assert the property
			// that actually holds: fresh signatures differ, and both verify.
			it('round-trips a freshly hedged signature', () => {
				const wallet = newMLDSA87WalletFromExtendedSeed(hex(extendedSeed));
				const messageBytes = Buffer.from(message, 'utf8');
				const first = wallet.sign(messageBytes);
				const second = wallet.sign(messageBytes);

				expect(bytesToHex(first)).not.toBe(bytesToHex(second));

				for (const signature of [first, second]) {
					expect(
						verifyMLDSA87Signature(
							signature,
							messageBytes,
							hex(wantPK),
							wallet.getDescriptor(),
						),
					).toBe(true);
				}
			});
		},
	);
});
