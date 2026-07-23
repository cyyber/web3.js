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
	 *     address: 'QA467d314BBB1E36687FfC9B277d3E163787E59641390075162BDd080E28Ddf6Ca810e1eA17308d3bec9300f85dF4F3dE54C647b4f7F02e0c9821478ac20491A1',
	 *     seed: '0x010000034da61fe50c659a3285549dc395571e2bf6891c462c041e3c6b9061fc73eb3687d03f940e5e65d582019ef10ce1327f',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   {
	 *     address: 'Q50d1766d3113D213131A20d97CcC89190Ef68ea3e34F6E797A402c2E18119f718f05898f2F47100b37375795f56b6F16b7a1F358f833c49DC4dDD64c3FDdb052',
	 *     seed: '0x0100007fc43a2ccb557f900d4ca924c187b4438a7f8185b8edbfbabdd26b87f125594495268f55ceac9c9eb23efaab76b0d4c5',
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
	 *     'Qa467d314bbb1e36687ffc9b277d3e163787e59641390075162bdd080e28ddf6ca810e1ea17308d3bec9300f85df4f3de54c647b4f7f02e0c9821478ac20491a1' => 0,
	 *     'Q50d1766d3113d213131a20d97ccc89190ef68ea3e34f6e797a402c2e18119f718f05898f2f47100b37375795f56b6f16b7a1f358f833c49dc4ddd64c3fddb052' => 1
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
	 * web3.qrl.accounts.wallet.add('0x010000c902ea9bbf1dd51aaa2ee9bed126aba921f6a6afac9cf09a21f3d915b057bace6787a894a71d1d103992aca0a6a4250c');
	 * > Wallet(1) [
	 *   {
	 *     address: 'Q68eD7F1481bb2CDA83A0A0D55F1f54c3a6eaef4e45c93D7925b42537c61057B7A0F42E1627beafC0A2DE9d1437183e49c47fA79274cc640D051adBaE9d9aDa12',
	 *     seed: '0x010000c902ea9bbf1dd51aaa2ee9bed126aba921f6a6afac9cf09a21f3d915b057bace6787a894a71d1d103992aca0a6a4250c',
	 *     signTransaction: [Function: signTransaction],
	 *     sign: [Function: sign],
	 *     encrypt: [Function: encrypt]
	 *   },
	 *   _accountProvider: {
	 *     create: [Function: create],
	 *     publicKeyToAccount: [Function: publicKeyToAccount],
	 *     decrypt: [Function: decrypt]
	 *   },
	 *   _addressMap: Map(1) { 'Q68ed7f1481bb2cda83a0a0d55f1f54c3a6eaef4e45c93d7925b42537c61057b7a0f42e1627beafc0a2de9d1437183e49c47fa79274cc640d051adbae9d9ada12' => 0 },
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
	 * web3.qrl.accounts.wallet.add('0x010000c902ea9bbf1dd51aaa2ee9bed126aba921f6a6afac9cf09a21f3d915b057bace6787a894a71d1d103992aca0a6a4250c');
	 *
	 * web3.qrl.accounts.wallet.remove('Q68eD7F1481bb2CDA83A0A0D55F1f54c3a6eaef4e45c93D7925b42537c61057B7A0F42E1627beafC0A2DE9d1437183e49c47fA79274cc640D051adBaE9d9aDa12');
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
	 *     address: 'Q0c2d8355005433f1c0bfca0ffc9d9ba1be6503dbaa3396cec0187794fe1e5dced7647a6036a18d42300e69758a15a06bcd5b1d00213a135ea529bc3569b90bc7',
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
	 *     address: 'Q0c2d8355005433f1c0bfca0ffc9d9ba1be6503dbaa3396cec0187794fe1e5dced7647a6036a18d42300e69758a15a06bcd5b1d00213a135ea529bc3569b90bc7',
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
	 *     address: 'Q0c2d8355005433f1C0bFCA0FFC9d9BA1BE6503dbaa3396ceC0187794Fe1e5dCeD7647A6036A18d42300e69758A15A06bcD5B1D00213a135Ea529bc3569B90bc7',
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
	 *   _addressMap: Map(1) { 'Q0c2d8355005433f1c0bfca0ffc9d9ba1be6503dbaa3396cec0187794fe1e5dced7647a6036a18d42300e69758a15a06bcd5b1d00213a135ea529bc3569b90bc7' => 0 },
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
