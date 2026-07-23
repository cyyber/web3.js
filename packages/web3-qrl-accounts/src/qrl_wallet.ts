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
	Descriptor as ExternalDescriptor,
	ExtendedSeed as ExternalExtendedSeed,
	Seed as ExternalSeed,
	WalletType as ExternalWalletType,
	newMLDSA87Descriptor as createMLDSA87Descriptor,
	newWalletFromExtendedSeed as createWalletFromExtendedSeed,
} from '@theqrl/wallet.js';
import { CryptoBytes, cryptoSignSignature, cryptoSignVerify } from '@theqrl/mldsa87';
import sha3 from 'js-sha3';

const { shake256 } = sha3;

export type QrlDescriptor = {
	type(): number;
	toBytes(): Uint8Array;
};

export type QrlSeed = {
	toBytes(): Uint8Array;
};

export type QrlExtendedSeed = {
	getDescriptor(): QrlDescriptor;
	toBytes(): Uint8Array;
};

export type MLDSA87Wallet = {
	getAddressStr(): string;
	getDescriptor(): QrlDescriptor;
	getExtendedSeed(): QrlExtendedSeed;
	getPK(): Uint8Array;
	getSK(): Uint8Array;
	sign(message: Uint8Array): Uint8Array;
};

const SIGNING_CONTEXT_PREFIX = new Uint8Array([0x5a, 0x4f, 0x4e, 0x44]);
const SIGNING_CONTEXT_VERSION = 0x01;

type ExtendedSeedInput = QrlExtendedSeed | Uint8Array | string;

const Descriptor = ExternalDescriptor as unknown as {
	from(input: string | Uint8Array | Buffer | number[]): QrlDescriptor;
};

const ExtendedSeed = ExternalExtendedSeed as unknown as {
	newExtendedSeed(desc: QrlDescriptor, seed: QrlSeed): QrlExtendedSeed;
};

const Seed = ExternalSeed as unknown as {
	from(input: string | Uint8Array | Buffer | number[]): QrlSeed;
};

const WalletType = ExternalWalletType as unknown as {
	ML_DSA_87: number;
};

const typedCreateWalletFromExtendedSeed = createWalletFromExtendedSeed as unknown as (
	extendedSeed: ExtendedSeedInput,
) => MLDSA87Wallet;

const typedCreateMLDSA87Descriptor = createMLDSA87Descriptor as unknown as () => QrlDescriptor;

export const addressFromPublicKeyAndDescriptor = (
	publicKey: Uint8Array,
	descriptor: QrlDescriptor,
): Uint8Array => {
	const descriptorBytes = descriptor.toBytes();
	const input = new Uint8Array(descriptorBytes.length + publicKey.length);
	input.set(descriptorBytes);
	input.set(publicKey, descriptorBytes.length);
	return new Uint8Array(shake256.array(input, 512));
};

export const newMLDSA87WalletFromExtendedSeed = (extendedSeed: ExtendedSeedInput): MLDSA87Wallet =>
	typedCreateWalletFromExtendedSeed(extendedSeed);

export const descriptorFromBytes = (bytes: Uint8Array): QrlDescriptor => Descriptor.from(bytes);

export const newMLDSA87Descriptor = (): QrlDescriptor => typedCreateMLDSA87Descriptor();

export const newQrlExtendedSeed = (descriptor: QrlDescriptor, seed: QrlSeed): QrlExtendedSeed =>
	ExtendedSeed.newExtendedSeed(descriptor, seed);

export const qrlSeedFromBytes = (bytes: Uint8Array): QrlSeed => Seed.from(bytes);

export const qrlWalletType = {
	ML_DSA_87: WalletType.ML_DSA_87,
} as const;

export const getMLDSA87SigningContext = (descriptor: Uint8Array): Uint8Array => {
	const context = new Uint8Array(SIGNING_CONTEXT_PREFIX.length + 1 + descriptor.length);
	context.set(SIGNING_CONTEXT_PREFIX);
	context[SIGNING_CONTEXT_PREFIX.length] = SIGNING_CONTEXT_VERSION;
	context.set(descriptor, SIGNING_CONTEXT_PREFIX.length + 1);
	return context;
};

export const signMLDSA87Message = (wallet: MLDSA87Wallet, message: Uint8Array): Uint8Array => {
	const descriptor = wallet.getDescriptor().toBytes();
	const secretKey = wallet.getSK();
	const signature = new Uint8Array(CryptoBytes);
	try {
		cryptoSignSignature(
			signature,
			message,
			secretKey,
			false,
			getMLDSA87SigningContext(descriptor),
		);
		return signature;
	} finally {
		secretKey.fill(0);
	}
};

export const verifyMLDSA87Signature = (
	signature: Uint8Array,
	message: Uint8Array,
	publicKey: Uint8Array,
	descriptor: Uint8Array,
): boolean => cryptoSignVerify(signature, message, publicKey, getMLDSA87SigningContext(descriptor));
