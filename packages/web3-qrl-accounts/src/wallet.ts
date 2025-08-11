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

import { Web3BaseWallet, Web3BaseWalletAccount, KeyStore } from '@theqrl/web3-types';
import { isNullish } from '@theqrl/web3-validator';
import { WebStorage } from './types.js';

type BrowserError = { code: number; name: string };

/**
 * Wallet is an in memory `wallet` that can hold multiple accounts.
 * These accounts can be used when using web3.qrl.sendTransaction().
 *
 * ### Parameters
 *  Web3AccountProvider - AccountProvider for the wallet
 *
 * ```ts
 * import Web3 from '@theqrl/web3';
 * const web3 = new Web3("https://localhost:8454")
 * web3.qrl.accounts.wallet
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
	private readonly _defaultKeyName = 'web3js_wallet';

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
	 * web3.qrl.accounts.wallet.create(2)
	 * > Wallet(2) [
	 *   {
	 *     address: 'Qde38310a42B751AE57d30cFFF4a0A3c52A442fCE',
	 *     seed: '0x6422c9d28efdcbee93c1d32a5fc6fd6fa081b985487885296cf8c9bbb5872600',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   {
	 *     address: 'Q766BF755246d924B1d017Fdb5390f38a60166691',
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
	 *     'Qde38310a42b751ae57d30cfff4a0a3c52a442fce' => 0,
	 *     'Q766bf755246d924b1d017fdb5390f38a60166691' => 1
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
	 * web3.qrl.accounts.wallet.add('0xbce9b59981303e76c4878b1a6d7b088ec6b9dd5c966b7d5f54d7a749ff683387');
	 * > Wallet(1) [
	 *   {
	 *     address: 'Q85D70633b90e03e0276B98880286D0D055685ed7',
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
	 *   _addressMap: Map(1) { 'Q85d70633b90e03e0276b98880286d0d055685ed7' => 0 },
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
			console.warn(`Account Q${account.address.slice(1).toLowerCase()} already exists.`);
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
	 * web3.qrl.accounts.wallet.add('0xbce9b59981303e76c4878b1a6d7b088ec6b9dd5c966b7d5f54d7a749ff683387');
	 *
	 * web3.qrl.accounts.wallet.remove('Q85D70633b90e03e0276B98880286D0D055685ed7');
	 * > true
	 * web3.qrl.accounts.wallet
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
	 * web3.qrl.accounts.wallet.clear();
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

	/**
	 * Encrypts all wallet accounts to an array of encrypted keystore v1 objects.
	 *
	 * @param password - The password which will be used for encryption
	 * @param options - encryption options
	 * @returns An array of the encrypted keystore v1.
	 *
	 * ```ts
	 * web3.qrl.accounts.wallet.create(1)
	 * web3.qrl.accounts.wallet.encrypt("abc").then((res) => console.log(util.inspect(res, { depth: null })));
	 * > 
	 * [
	 *   {
	 *     version: 1,
	 *     id: 'ccb92c3f-94c3-4ca0-86a9-1becdb1855b4',
	 *     address: 'Q20fd3c13848a14e2ec61a53492140c26034e3fd6',
	 *     crypto: {
	 *       ciphertext: '9171df3615b852a8c899c0a86885fa2d932db27c17b212ee346cdad1be896736c32e48f6d8d9d2b6ff210d2454d2cc9c736147293dd47d4be0e104105599b11c',
	 *       cipherparams: { iv: '259d7d6b79c11d3f2e4b88da' },
	 *       cipher: 'aes-256-gcm',
	 *       kdf: 'argon2id',
	 *       kdfparams: {
	 *         m: 262144,
	 *         t: 8,
	 *         p: 1,
	 *         dklen: 32,
	 *         salt: '5741148953f0489db3035cb1a4981763e17a0446f684054a5ad3e06d53ca0fe3'
	 *       }
	 *     }
	 *   }
	 * ]
	 * ```
	 */
	public async encrypt(
		password: string,
		options?: Record<string, unknown> | undefined,
	): Promise<KeyStore[]> {
		return Promise.all(this.map(async (account: T) => account.encrypt(password, options)));
	}

	/**
	 * Decrypts keystore v1 objects.
	 *
	 * @param encryptedWallets - An array of encrypted keystore v1 objects to decrypt
	 * @param password - The password to encrypt with
	 * @param options - decrypt options for the wallets
	 * @returns The decrypted wallet object
	 *
	 * ```ts
	 * web3.qrl.accounts.wallet.decrypt([
	 *   {
	 *     version: 1,
	 *     id: 'ccb92c3f-94c3-4ca0-86a9-1becdb1855b4',
	 *     address: 'Q20fd3c13848a14e2ec61a53492140c26034e3fd6',
	 *     crypto: {
	 *       ciphertext: '9171df3615b852a8c899c0a86885fa2d932db27c17b212ee346cdad1be896736c32e48f6d8d9d2b6ff210d2454d2cc9c736147293dd47d4be0e104105599b11c',
	 *       cipherparams: { iv: '259d7d6b79c11d3f2e4b88da' },
	 *       cipher: 'aes-256-gcm',
	 *       kdf: 'argon2id',
	 *       kdfparams: {
	 *         m: 262144,
	 *         t: 8,
	 *         p: 1,
	 *         dklen: 32,
	 *         salt: '5741148953f0489db3035cb1a4981763e17a0446f684054a5ad3e06d53ca0fe3'
	 *       }
	 *     }
	 *   }
	 * ], "abc").then((res) => console.log(util.inspect(res, { depth: null })));
	 * >
	 * Wallet(1) [
	 *   {
	 *     address: 'Q20FD3c13848A14e2EC61A53492140c26034E3FD6',
	 *     seed: '0x1a3bbb0aa289420ef915059a093cfed7e92990043b01ba8b5407a56aafae5507576781603015f6db7d33920a4947a261',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   _accountProvider: {
	 *     create: [Function: createWithContext],
	 *     seedToAccount: [Function: seedToAccountWithContext],
	 *     decrypt: [Function: decryptWithContext]
	 *   },
	 *   _addressMap: Map(1) { 'Q20fd3c13848a14e2ec61a53492140c26034e3fd6' => 0 },
	 *   _defaultKeyName: 'web3js_wallet'
	 * ]
	 * ```
	 */
	public async decrypt(
		encryptedWallets: KeyStore[],
		password: string,
		options?: Record<string, unknown> | undefined,
	) {
		const results = await Promise.all(
			encryptedWallets.map(async (wallet: KeyStore) =>
				this._accountProvider.decrypt(wallet, password, options),
			),
		);
		for (const res of results) {
			this.add(res);
		}
		return this;
	}

	/**
	 * Stores the wallet encrypted and as string in local storage.
	 * **__NOTE:__** Browser only
	 *
	 * @param password - The password to encrypt the wallet
	 * @param keyName - (optional) The key used for the local storage position, defaults to `"web3js_wallet"`.
	 * @param options - (optional) encryption options
	 * @returns Will return boolean value true if saved properly
	 * ```ts
	 * web3.qrl.accounts.wallet.save('test#!$');
	 * >true
	 * ```
	 */
	public async save(
		password: string, 
		keyName?: string,
		options?: Record<string, unknown> | undefined,
	) {
		const storage = Wallet.getStorage();

		if (!storage) {
			throw new Error('Local storage not available.');
		}

		storage.setItem(
			keyName ?? this._defaultKeyName,
			JSON.stringify(await this.encrypt(password, options)),
		);

		return true;
	}

	/**
	 * Loads a wallet from local storage and decrypts it.
	 * **__NOTE:__** Browser only
	 *
	 * @param password - The password to decrypt the wallet.
	 * @param keyName - (optional)The key used for local storage position, defaults to `web3js_wallet"`
	 * @returns Returns the wallet object
	 *
	 * ```ts
	 * web3.qrl.accounts.wallet.save('test#!$');
	 * > true
	 * web3.qrl.accounts.wallet.load('test#!$');
	 * { defaultKeyName: "web3js_wallet",
	 *   length: 0,
	 *   _accounts: Accounts {_requestManager: RequestManager, givenProvider: Proxy, providers: {…}, _provider: WebsocketProvider, …},
	 *   [[Prototype]]: Object
	 * }
	 * ```
	 */
	public async load(password: string, keyName?: string) {
		const storage = Wallet.getStorage();

		if (!storage) {
			throw new Error('Local storage not available.');
		}

		const keystore = storage.getItem(keyName ?? this._defaultKeyName);

		if (keystore) {
			await this.decrypt((JSON.parse(keystore) as KeyStore[]) || [], password);
		}

		return this;
	}
}
