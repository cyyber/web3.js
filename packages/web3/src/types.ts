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

import { Bytes, Transaction } from '@theqrl/web3-types';
import QRL from '@theqrl/web3-qrl';
import {
	decodeLog,
	decodeParameter,
	decodeParameters,
	encodeFunctionCall,
	encodeFunctionSignature,
	encodeParameter,
	encodeParameters,
} from '@theqrl/web3-qrl-abi';
import {
	encrypt,
	hashMessage,
	recoverTransaction,
	sign,
	signTransaction,
	Wallet,
	Web3Account,
} from '@theqrl/web3-qrl-accounts';
import { Contract } from '@theqrl/web3-qrl-contract';
import { QRNS } from '@theqrl/web3-qrl-qrns';
import { Net } from '@theqrl/web3-net';
import { Iban } from '@theqrl/web3-qrl-iban';

/**
 * The QRL interface for main web3 object. It provides extra methods in addition to `web3-qrl` interface.
 *
 * {@link web3_qrl.Web3QRL} for details about the `QRL` interface.
 */
export interface Web3QRLInterface extends QRL {
	/**
	 * Extended [Contract](/api/web3-qrl-contract/class/Contract) constructor for main `web3` object. See [Contract](/api/web3-qrl-contract/class/Contract) for further details.
	 *
	 * You can use `.setProvider` on this constructor to set provider for **all the instances** of the contracts which were created by `web3.qrl.Contract`.
	 *
	 * ```ts
	 * web3.qrl.Contract.setProvider(myProvider)
	 * ```
	 */
	Contract: typeof Contract;
	Iban: typeof Iban;
	net: Net;
	qrns: QRNS;
	abi: {
		encodeEventSignature: typeof encodeFunctionSignature;
		encodeFunctionCall: typeof encodeFunctionCall;
		encodeFunctionSignature: typeof encodeFunctionSignature;
		encodeParameter: typeof encodeParameter;
		encodeParameters: typeof encodeParameters;
		decodeParameter: typeof decodeParameter;
		decodeParameters: typeof decodeParameters;
		decodeLog: typeof decodeLog;
	};
	accounts: {
		create: () => Web3Account;
		seedToAccount: (seed: Uint8Array | string) => Web3Account;
		signTransaction: (
			transaction: Transaction,
			seed: Bytes,
		) => ReturnType<typeof signTransaction>;
		recoverTransaction: typeof recoverTransaction;
		hashMessage: typeof hashMessage;
		sign: typeof sign;
		encrypt: typeof encrypt;
		decrypt: (
			keystore: string,
			password: string,
			options?: Record<string, unknown>,
		) => Promise<Web3Account>;
		wallet: Wallet;
	};
}
