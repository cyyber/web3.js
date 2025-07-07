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
import { Transaction } from './zond_types.js';
import { HexString } from './primitives_types.js';

export type Cipher = 'aes-256-gcm';

export type CipherOptions = {
	salt?: Uint8Array | string;
	iv?: Uint8Array | string;
	kdf?: 'argon2id';
	dklen?: number;
	t?: number; // iterations
	m?: number; // amount of memory (in kibibytes) to use
	p?: number; // number of iterations to perform
};

export type Argon2idParams = {
	dklen: number;
	t: number;
	m: number;
	p: number;
	salt: Uint8Array | string;
};

export type KeyStore = {
	crypto: {
		cipher: Cipher;
		ciphertext: string;
		cipherparams: {
			iv: string;
		};
		kdf: 'argon2id';
		kdfparams: Argon2idParams;
	};
	id: string;
	version: 1;
	address: string;
};

export interface Web3BaseWalletAccount {
	[key: string]: unknown;
	readonly address: string;
	readonly seed: string;
	readonly signTransaction: (tx: Transaction) => Promise<{
		readonly messageHash: HexString;
		readonly signature: HexString;
		readonly rawTransaction: HexString;
		readonly transactionHash: HexString;
	}>;
	readonly sign: (data: Record<string, unknown> | string) => {
		readonly messageHash: HexString;
		readonly message?: string;
		readonly signature: HexString;
	};
	readonly encrypt: (password: string, options?: Record<string, unknown>) => Promise<KeyStore>;
}

export interface Web3AccountProvider<T> {
	seedToAccount: (seed: string) => T;
	create: () => T;
	decrypt: (
		keystore: KeyStore | string,
		password: string,
		options?: Record<string, unknown>,
	) => Promise<T>;
}

export abstract class Web3BaseWallet<T extends Web3BaseWalletAccount> extends Array<T> {
	protected readonly _accountProvider: Web3AccountProvider<T>;

	public constructor(accountProvider: Web3AccountProvider<T>) {
		super();
		this._accountProvider = accountProvider;
	}

	public abstract create(numberOfAccounts: number): this;
	public abstract add(account: T | string): this;
	public abstract get(addressOrIndex: string | number): T | undefined;
	public abstract remove(addressOrIndex: string | number): boolean;
	public abstract clear(): this;
	public abstract encrypt(
		password: string,
		options?: Record<string, unknown>,
	): Promise<KeyStore[]>;
	public abstract decrypt(
		encryptedWallet: KeyStore[],
		password: string,
		options?: Record<string, unknown>,
	): Promise<this>;
	public abstract save(
		password: string, 
		keyName?: string,
		options?: Record<string, unknown>,
	): Promise<boolean | never>;
	public abstract load(password: string, keyName?: string): Promise<this | never>;
}
