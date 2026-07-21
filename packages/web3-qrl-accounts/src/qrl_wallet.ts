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
	Descriptor,
	ExtendedSeed,
	MLDSA87,
	Seed,
	WalletType,
	newMLDSA87Descriptor as createMLDSA87Descriptor,
	newWalletFromExtendedSeed as createWalletFromExtendedSeed,
} from '@theqrl/wallet.js';
import { shake256 } from '@theqrl/qrl-cryptography/keccak.js';

/*
 * These aliases re-export the upstream `@theqrl/wallet.js` types under the
 * names this package already used. They are aliases, not structural
 * re-declarations: the upstream classes carry private state, so a structural
 * look-alike would not be assignable back into upstream APIs such as
 * `MLDSA87.verify`. Aliasing keeps the compiler checking our integration
 * against the real signing surface.
 */
export type QrlDescriptor = Descriptor;
export type QrlSeed = Seed;
export type QrlExtendedSeed = ExtendedSeed;
export type MLDSA87Wallet = MLDSA87;

type ExtendedSeedInput = QrlExtendedSeed | Uint8Array | string;

export const addressFromPublicKeyAndDescriptor = (
	publicKey: Uint8Array,
	descriptor: QrlDescriptor,
): Uint8Array => {
	const descriptorBytes = descriptor.toBytes();
	const input = new Uint8Array(descriptorBytes.length + publicKey.length);
	input.set(descriptorBytes);
	input.set(publicKey, descriptorBytes.length);
	return new Uint8Array(shake256(input, { dkLen: 64 }));
};

export const newMLDSA87WalletFromExtendedSeed = (extendedSeed: ExtendedSeedInput): MLDSA87Wallet =>
	createWalletFromExtendedSeed(extendedSeed);

export const descriptorFromBytes = (bytes: Uint8Array): QrlDescriptor => Descriptor.from(bytes);

export const newMLDSA87Descriptor = (): QrlDescriptor => createMLDSA87Descriptor();

export const newQrlExtendedSeed = (descriptor: QrlDescriptor, seed: QrlSeed): QrlExtendedSeed =>
	ExtendedSeed.newExtendedSeed(descriptor, seed);

export const qrlSeedFromBytes = (bytes: Uint8Array): QrlSeed => Seed.from(bytes);

export const qrlWalletType = {
	ML_DSA_87: WalletType.ML_DSA_87,
} as const;

export const verifyMLDSA87Signature = (
	signature: Uint8Array,
	message: Uint8Array,
	publicKey: Uint8Array,
	descriptor: QrlDescriptor,
): boolean => MLDSA87.verify(signature, message, publicKey, descriptor);
