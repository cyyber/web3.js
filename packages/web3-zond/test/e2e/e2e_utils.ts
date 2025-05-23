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

/**
 * @NOTE This Util method is kept seperate from shared system_test_utils.ts file because
 * of it's import of .secrets.json. For this method to exist in shared system_test_utils.ts
 * file, the import path would be ../.secrets.json which doesn't resolve when the file is
 * copied over to each package's test directory. Because web3 package is the only package
 * running these E2E tests that use Testnet and Mainnet, this util exists here for now.
 */

import { getSystemTestBackend } from '../fixtures/system_test_utils';
// eslint-disable-next-line import/no-relative-packages
import secrets from '../../../../.secrets.json';

export const getSystemE2ETestProvider = (): string => {
	if (process.env.WEB3_SYTEM_TEST_MODE === 'http') {
		return getSystemTestBackend() === 'testnet'
			? process.env.ZOND_TESTNET_HTTP ?? secrets.TESTNET.HTTP
			: process.env.ZOND_MAINNET_HTTP ?? secrets.MAINNET.HTTP;
	}
	return getSystemTestBackend() === 'testnet'
		? process.env.ZOND_TESTNET_WS ?? secrets.TESTNET.WS
		: process.env.ZOND_MAINNET_WS ?? secrets.MAINNET.WS;
};

export const getE2ETestAccountAddress = (): string => {
	if (process.env.TEST_ACCOUNT_ADDRESS !== undefined) {
		return process.env.TEST_ACCOUNT_ADDRESS;
		// eslint-disable-next-line no-else-return
	} else if (getSystemTestBackend() === 'testnet' || getSystemTestBackend() === 'mainnet') {
		return secrets[getSystemTestBackend().toUpperCase() as 'TESTNET' | 'MAINNET'].ACCOUNT
			.address;
	}

	throw new Error('Unable to get test account address');
};

export const getE2ETestContractAddress = () =>
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
	secrets[getSystemTestBackend().toUpperCase() as 'TESTNET' | 'MAINNET']
		.DEPLOYED_TEST_CONTRACT_ADDRESS as string;

export const getAllowedSendTransaction = (): boolean => {
	if (process.env.ALLOWED_SEND_TRANSACTION !== undefined) {
		// https://github.com/actions/runner/issues/1483
		if (process.env.ALLOWED_SEND_TRANSACTION === 'false') {
			return false;
		}

		return Boolean(process.env.ALLOWED_SEND_TRANSACTION);
		// eslint-disable-next-line no-else-return
	} else if (getSystemTestBackend() === 'testnet' || getSystemTestBackend() === 'mainnet') {
		return secrets[getSystemTestBackend().toUpperCase() as 'TESTNET' | 'MAINNET']
			.ALLOWED_SEND_TRANSACTION;
	}

	return false;
};

export const getE2ETestAccountSeed = (): string => {
	if (process.env.TEST_ACCOUNT_PRIVATE_KEY !== undefined) {
		return process.env.TEST_ACCOUNT_PRIVATE_KEY;
		// eslint-disable-next-line no-else-return
	} else if (getSystemTestBackend() === 'testnet' || getSystemTestBackend() === 'mainnet') {
		return secrets[getSystemTestBackend().toUpperCase() as 'TESTNET' | 'MAINNET'].ACCOUNT.seed;
	}

	throw new Error('Unable to get test account private key');
};
