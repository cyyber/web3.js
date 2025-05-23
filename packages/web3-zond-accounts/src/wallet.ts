﻿/*
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

import { Web3BaseWallet, Web3BaseWalletAccount /* KeyStore */ } from '@theqrl/web3-types';
import { isNullish } from '@theqrl/web3-validator';
import { WebStorage } from './types.js';

type BrowserError = { code: number; name: string };

/**
 * Wallet is an in memory `wallet` that can hold multiple accounts.
 * These accounts can be used when using web3.zond.sendTransaction().
 *
 * ### Parameters
 *  Web3AccountProvider - AccountProvider for the wallet
 *
 * ```ts
 * import Web3 from '@theqrl/web3';
 * const web3 = new Web3("https://localhost:8454")
 * web3.zond.accounts.wallet
 * > Wallet(0) [
 *   _accountProvider: {
 *     create: [Function: create],
 *     publicKeyToAccount: [Function: publicKeyToAccount],
 *     decrypt: [Function: decrypt]
 *   },
 *   _addressMap: Map(0) {},
 *   _defaultKeyName: 'web3js_wallet'
 * ]
 * ```
 */
export class Wallet<
	T extends Web3BaseWalletAccount = Web3BaseWalletAccount,
> extends Web3BaseWallet<T> {
	private readonly _addressMap = new Map<string, number>();
	// private readonly _defaultKeyName = 'web3js_wallet';

	/**
	 * Get the storage object of the browser
	 *
	 * @returns the storage
	 */
	public static getStorage(): WebStorage | undefined {
		let storage: WebStorage | undefined;

		try {
			storage = window.localStorage;
			const x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);

			return storage;
		} catch (e: unknown) {
			return (e as BrowserError) &&
				// everything except Firefox
				((e as BrowserError).code === 22 ||
					// Firefox
					(e as BrowserError).code === 1014 ||
					// test name field too, because code might not be present
					// everything except Firefox
					(e as BrowserError).name === 'QuotaExceededError' ||
					// Firefox
					(e as BrowserError).name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				!isNullish(storage) &&
				storage.length !== 0
				? storage
				: undefined;
		}
	}
	/**
	 * Generates one or more accounts in the wallet. If wallets already exist they will not be overridden.
	 *
	 * @param numberOfAccounts - Number of accounts to create. Leave empty to create an empty wallet.
	 * @returns The wallet
	 * ```ts
	 * web3.zond.accounts.wallet.create(2)
	 * > Wallet(2) [
	 *   {
	 *     address: 'Zde38310a42B751AE57d30cFFF4a0A3c52A442fCE',
	 *     seed: '0x6422c9d28efdcbee93c1d32a5fc6fd6fa081b985487885296cf8c9bbb5872600',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   {
	 *     address: 'Z766BF755246d924B1d017Fdb5390f38a60166691',
	 *     seed: '0x756530f13c0eb636ebdda655335f5dea9921e3362e2e588b0ad59e556f7751f0',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   _accountProvider: {
	 *     create: [Function: create],
	 *     publicKeyToAccount: [Function: publicKeyToAccount],
	 *     decrypt: [Function: decrypt]
	 *   },
	 *   _addressMap: Map(2) {
	 *     'Zde38310a42b751ae57d30cfff4a0a3c52a442fce' => 0,
	 *     'Z766bf755246d924b1d017fdb5390f38a60166691' => 1
	 *   },
	 *   _defaultKeyName: 'web3js_wallet'
	 * ]
	 *
	 * ```
	 */

	public create(numberOfAccounts: number) {
		for (let i = 0; i < numberOfAccounts; i += 1) {
			this.add(this._accountProvider.create());
		}

		return this;
	}

	/**
	 * Adds an account using a seed or account object to the wallet.
	 *
	 * @param account - A private key or account object
	 * @returns The wallet
	 *
	 * ```ts
	 * web3.zond.accounts.wallet.add('0xbce9b59981303e76c4878b1a6d7b088ec6b9dd5c966b7d5f54d7a749ff683387');
	 * > Wallet(1) [
	 *   {
	 *     address: 'Z85D70633b90e03e0276B98880286D0D055685ed7',
	 *     seed: '0xbce9b59981303e76c4878b1a6d7b088ec6b9dd5c966b7d5f54d7a749ff683387',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   _accountProvider: {
	 *     create: [Function: create],
	 *     publicKeyToAccount: [Function: publicKeyToAccount],
	 *     decrypt: [Function: decrypt]
	 *   },
	 *   _addressMap: Map(1) { 'Z85d70633b90e03e0276b98880286d0d055685ed7' => 0 },
	 *   _defaultKeyName: 'web3js_wallet'
	 * ]
	 * ```
	 */
	public add(account: T | string): this {
		if (typeof account === 'string') {
			return this.add(this._accountProvider.seedToAccount(account));
		}
		let index = this.length;
		const existAccount = this.get(account.address);
		if (existAccount) {
			console.warn(`Account Z${account.address.slice(1).toLowerCase()} already exists.`);
			index = this._addressMap.get(account.address.toLowerCase()) ?? index;
		}
		this._addressMap.set(account.address.toLowerCase(), index);
		this[index] = account;

		return this;
	}
	/**
	 * Get the account of the wallet with either the index or public address.
	 *
	 * @param addressOrIndex - A string of the address or number index within the wallet.
	 * @returns The account object or undefined if the account doesn't exist
	 */

	public get(addressOrIndex: string | number): T | undefined {
		if (typeof addressOrIndex === 'string') {
			const index = this._addressMap.get(addressOrIndex.toLowerCase());

			if (!isNullish(index)) {
				return this[index];
			}

			return undefined;
		}

		return this[addressOrIndex];
	}

	/**
	 * Removes an account from the wallet.
	 *
	 * @param addressOrIndex - The account address, or index in the wallet.
	 * @returns true if the wallet was removed. false if it couldn't be found.
	 * ```ts
	 * web3.zond.accounts.wallet.add('0xbce9b59981303e76c4878b1a6d7b088ec6b9dd5c966b7d5f54d7a749ff683387');
	 *
	 * web3.zond.accounts.wallet.remove('Z85D70633b90e03e0276B98880286D0D055685ed7');
	 * > true
	 * web3.zond.accounts.wallet
	 * > Wallet(0) [
	 * _accountProvider: {
	 *   create: [Function: create],
	 *   publicKeyToAccount: [Function: publicKeyToAccount],
	 *   decrypt: [Function: decrypt]
	 * },
	 * _addressMap: Map(0) {},
	 * _defaultKeyName: 'web3js_wallet'
	 * ]
	 * ```
	 */
	public remove(addressOrIndex: string | number): boolean {
		if (typeof addressOrIndex === 'string') {
			const index = this._addressMap.get(addressOrIndex.toLowerCase());
			if (isNullish(index)) {
				return false;
			}
			this._addressMap.delete(addressOrIndex.toLowerCase());
			this.splice(index, 1);

			return true;
		}

		if (this[addressOrIndex]) {
			this.splice(addressOrIndex, 1);
			return true;
		}

		return false;
	}

	/**
	 * Securely empties the wallet and removes all its accounts.
	 * Use this with *caution as it will remove all accounts stored in local wallet.
	 *
	 * @returns The wallet object
	 * ```ts
	 *
	 * web3.zond.accounts.wallet.clear();
	 * > Wallet(0) [
	 * _accountProvider: {
	 *   create: [Function: create],
	 *   publicKeyToAccount: [Function: publicKeyToAccount],
	 *   decrypt: [Function: decrypt]
	 * },
	 * _addressMap: Map(0) {},
	 * _defaultKeyName: 'web3js_wallet'
	 * ]
	 * ```
	 */
	public clear() {
		this._addressMap.clear();

		// Setting length clears the Array in JS.
		this.length = 0;

		return this;
	}

	// TODO(youtrack/theqrl/web3.js/3)
	/**
	 * Encrypts all wallet accounts to an array of encrypted keystore v3 objects.
	 *
	 * @param password - The password which will be used for encryption
	 * @param options - encryption options
	 * @returns An array of the encrypted keystore v3.
	 *
	 * ```ts
	 * web3.zond.accounts.wallet.create(1)
	 * web3.zond.accounts.wallet.encrypt("abc").then(console.log);
	 * > [
	 * '{"version":3,"id":"fa46e213-a7c3-4844-b903-dd14d39cc7db",
	 * "address":"fa3e41a401609103c241431cbdee8623ae2a321a","crypto":
	 * {"ciphertext":"8d179a911d6146ad2924e86bf493ed89b8ff3596ffec0816e761c542016ab13c",
	 * "cipherparams":{"iv":"acc888c6cf4a19b86846cef0185a7164"},"cipher":"aes-128-ctr",
	 * "kdf":"scrypt","kdfparams":{"n":8192,"r":8,"p":1,"dklen":32,"salt":"6a743c9b367d15f4758e4f3f3378ff0fd443708d1c64854e07588ea5331823ae"},
	 * "mac":"410544c8307e3691fda305eb3722d82c3431f212a87daa119a21587d96698b57"}}'
	 * ]
	 * ```
	 */
	// public async encrypt(
	// 	password: string,
	// 	options?: Record<string, unknown> | undefined,
	// ): Promise<KeyStore[]> {
	// 	return Promise.all(this.map(async (account: T) => account.encrypt(password, options)));
	// }

	// TODO(youtrack/theqrl/web3.js/3)
	/**
	 * Decrypts keystore v3 objects.
	 *
	 * @param encryptedWallets - An array of encrypted keystore v3 objects to decrypt
	 * @param password - The password to encrypt with
	 * @param options - decrypt options for the wallets
	 * @returns The decrypted wallet object
	 *
	 * ```ts
	 * web3.zond.accounts.wallet.decrypt([
	 * { version: 3,
	 * id: '83191a81-aaca-451f-b63d-0c5f3b849289',
	 * address: '06f702337909c06c82b09b7a22f0a2f0855d1f68',
	 * crypto:
	 * { ciphertext: '7d34deae112841fba86e3e6cf08f5398dda323a8e4d29332621534e2c4069e8d',
	 *   cipherparams: { iv: '497f4d26997a84d570778eae874b2333' },
	 *   cipher: 'aes-128-ctr',
	 *   kdf: 'scrypt',
	 *   kdfparams:
	 *    { dklen: 32,
	 *      salt: '208dd732a27aa4803bb760228dff18515d5313fd085bbce60594a3919ae2d88d',
	 *      n: 262144,
	 *      r: 8,
	 *      p: 1 },
	 *   mac: '0062a853de302513c57bfe3108ab493733034bf3cb313326f42cf26ea2619cf9' } },
	 * { version: 3,
	 * id: '7d6b91fa-3611-407b-b16b-396efb28f97e',
	 * address: 'b5d89661b59a9af0b34f58d19138baa2de48baaf',
	 * crypto:
	 * { ciphertext: 'cb9712d1982ff89f571fa5dbef447f14b7e5f142232bd2a913aac833730eeb43',
	 *   cipherparams: { iv: '8cccb91cb84e435437f7282ec2ffd2db' },
	 *   cipher: 'aes-128-ctr',
	 *   kdf: 'scrypt',
	 *   kdfparams:
	 *    { dklen: 32,
	 *      salt: '08ba6736363c5586434cd5b895e6fe41ea7db4785bd9b901dedce77a1514e8b8',
	 *      n: 262144,
	 *      r: 8,
	 *      p: 1 },
	 *   mac: 'd2eb068b37e2df55f56fa97a2bf4f55e072bef0dd703bfd917717d9dc54510f0' } }
	 * ], 'test').then(console.log)
	 * > Wallet {
	 *   _accountProvider: {
	 *     create: [Function: create],
	 *     publicKeyToAccount: [Function: publicKeyToAccount],
	 *     decrypt: [Function: decrypt]
	 *   },
	 *   _defaultKeyName: 'web3js_wallet',
	 *   _accounts: {
	 *     'Z85d70633b90e03e0276b98880286d0d055685ed7': {
	 *       address: 'Z85D70633b90e03e0276B98880286D0D055685ed7',
	 *       seed: '0xbce9b59981303e76c4878b1a6d7b088ec6b9dd5c966b7d5f54d7a749ff683387',
	 *       signTransaction: [Function: signTransaction],
	 *       sign: [Function: sign],
	 *       encrypt: [Function: encrypt]
	 *     },
	 *     'Z06f702337909c06c82b09b7a22f0a2f0855d1f68': {
	 *       address: 'Z06F702337909C06C82B09B7A22F0a2f0855d1F68',
	 *       seed: '87a51da18900da7398b3bab03996833138f269f8f66dd1237b98df6b9ce14573',
	 *       signTransaction: [Function: signTransaction],
	 *       sign: [Function: sign],
	 *       encrypt: [Function: encrypt]
	 *     },
	 *     'Zb5d89661b59a9af0b34f58d19138baa2de48baaf': {
	 *       address: 'ZB5d89661B59a9aF0b34f58D19138bAa2de48BAaf',
	 *       seed: '7ee61c5282979aae9dd795bb6a54e8bdc2bfe009acb64eb9a67322eec3b3da6e',
	 *       signTransaction: [Function: signTransaction],
	 *       sign: [Function: sign],
	 *       encrypt: [Function: encrypt]
	 *     }
	 *   }
	 * }
	 * ```
	 */
	// public async decrypt(
	// 	encryptedWallets: KeyStore[],
	// 	password: string,
	// 	options?: Record<string, unknown> | undefined,
	// ) {
	// 	const results = await Promise.all(
	// 		encryptedWallets.map(async (wallet: KeyStore) =>
	// 			this._accountProvider.decrypt(wallet, password, options),
	// 		),
	// 	);
	// 	for (const res of results) {
	// 		this.add(res);
	// 	}
	// 	return this;
	// }

	/**
	 * Stores the wallet encrypted and as string in local storage.
	 * **__NOTE:__** Browser only
	 *
	 * @param password - The password to encrypt the wallet
	 * @param keyName - (optional) The key used for the local storage position, defaults to `"web3js_wallet"`.
	 * @returns Will return boolean value true if saved properly
	 * ```ts
	 * web3.zond.accounts.wallet.save('test#!$');
	 * >true
	 * ```
	 */
	// public async save(password: string, keyName?: string) {
	// 	const storage = Wallet.getStorage();

	// 	if (!storage) {
	// 		throw new Error('Local storage not available.');
	// 	}

	// 	storage.setItem(
	// 		keyName ?? this._defaultKeyName,
	// 		JSON.stringify(await this.encrypt(password)),
	// 	);

	// 	return true;
	// }

	/**
	 * Loads a wallet from local storage and decrypts it.
	 * **__NOTE:__** Browser only
	 *
	 * @param password - The password to decrypt the wallet.
	 * @param keyName - (optional)The key used for local storage position, defaults to `web3js_wallet"`
	 * @returns Returns the wallet object
	 *
	 * ```ts
	 * web3.zond.accounts.wallet.save('test#!$');
	 * > true
	 * web3.zond.accounts.wallet.load('test#!$');
	 * { defaultKeyName: "web3js_wallet",
	 *   length: 0,
	 *   _accounts: Accounts {_requestManager: RequestManager, givenProvider: Proxy, providers: {…}, _provider: WebsocketProvider, …},
	 *   [[Prototype]]: Object
	 * }
	 * ```
	 */
	// public async load(password: string, keyName?: string) {
	// 	const storage = Wallet.getStorage();

	// 	if (!storage) {
	// 		throw new Error('Local storage not available.');
	// 	}

	// 	const keystore = storage.getItem(keyName ?? this._defaultKeyName);

	// 	if (keystore) {
	// 		await this.decrypt((JSON.parse(keystore) as KeyStore[]) || [], password);
	// 	}

	// 	return this;
	// }
}
