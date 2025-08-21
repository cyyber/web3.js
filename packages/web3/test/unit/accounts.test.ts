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

import * as qrl from '@theqrl/web3-qrl';
import * as qrlAccounts from '@theqrl/web3-qrl-accounts';
import { SignTransactionResult, Web3Account } from '@theqrl/web3-qrl-accounts';
import { Web3QRLInterface } from '../../src/types';
import { Web3 } from '../../src';

jest.mock('@theqrl/web3-qrl-accounts');
jest.mock('@theqrl/web3-qrl');

describe('test new Web3().qrl.accounts', () => {
	let accounts: Web3QRLInterface['accounts'];

	beforeAll(() => {
		const web3 = new Web3();
		accounts = web3.qrl.accounts;
	});

	beforeEach(() => {
		jest.spyOn(qrl, 'prepareTransactionForSigning').mockReturnValue({} as Promise<any>);
		jest.spyOn(qrlAccounts, 'signTransaction').mockReturnValue(
			undefined as unknown as Promise<SignTransactionResult>,
		);
	});
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('`signTransaction` should call the original `prepareTransactionForSigning` and `signTransaction`', async () => {
		await accounts.signTransaction({}, '');

		expect(qrl.prepareTransactionForSigning).toHaveBeenCalledTimes(1);
		expect(qrlAccounts.signTransaction).toHaveBeenCalledTimes(1);
	});

	it('`seedToAccount` should call the original `seedToAccount` and add `signTransaction`', async () => {
		jest.spyOn(qrlAccounts, 'seedToAccount').mockReturnValue({
			seed: '',
		} as unknown as Web3Account);

		const account = accounts.seedToAccount('');
		expect(qrlAccounts.seedToAccount).toHaveBeenCalledTimes(1);

		await account.signTransaction({});

		expect(qrl.prepareTransactionForSigning).toHaveBeenCalledTimes(1);
		expect(qrlAccounts.signTransaction).toHaveBeenCalledTimes(1);
	});

	it('`decrypt` should call the original `decrypt` and add `signTransaction`', async () => {
		jest.spyOn(qrlAccounts, 'decrypt').mockReturnValue({
			privateKey: '',
		} as unknown as Promise<Web3Account>);

		await accounts.decrypt('', '', { nonStrict: false });
		expect(qrlAccounts.decrypt).toHaveBeenCalledWith('', '', false);

		const account = await accounts.decrypt('', '');
		expect(qrlAccounts.decrypt).toHaveBeenCalledWith('', '', true);

		await account.signTransaction({});

		expect(qrl.prepareTransactionForSigning).toHaveBeenCalledTimes(1);
		expect(qrlAccounts.signTransaction).toHaveBeenCalledTimes(1);
	});

	it('`create` should call the original `create` and add `signTransaction`', async () => {
		jest.spyOn(qrlAccounts, 'create').mockReturnValue({
			seed: '',
		} as unknown as Web3Account);
		const account = accounts.create();

		expect(qrlAccounts.create).toHaveBeenCalledTimes(1);

		await account.signTransaction({});

		expect(qrl.prepareTransactionForSigning).toHaveBeenCalledTimes(1);
		expect(qrlAccounts.signTransaction).toHaveBeenCalledTimes(1);
	});
});
