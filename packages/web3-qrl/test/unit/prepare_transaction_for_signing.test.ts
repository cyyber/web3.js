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

import { QRLExecutionAPI } from '@theqrl/web3-types';
import { Web3Context } from '@theqrl/web3-core';
import HttpProvider from '@theqrl/web3-providers-http';
import { isNullish } from '@theqrl/web3-validator';
import { FeeMarketEIP1559Transaction } from '@theqrl/web3-qrl-accounts';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';

import { bytesToHex, hexToBytes } from '@theqrl/web3-utils';
import { prepareTransactionForSigning } from '../../src/utils/prepare_transaction_for_signing';
import { validTransactions } from '../fixtures/prepare_transaction_for_signing';

// TODO(rgeraldes24)
describe.skip('prepareTransactionForSigning', () => {
	const web3Context = new Web3Context<QRLExecutionAPI>({
		provider: new HttpProvider('http://127.0.0.1'),
		config: { defaultNetworkId: '0x1' },
	});

	describe('should return an web3-utils/tx instance with expected properties', () => {
		it.each(validTransactions)(
			'mockBlock: %s\nexpectedTransaction: %s\nexpectedSeed: %s\nexpectedAddress: %s\nexpectedRlpEncodedTransaction: %s\nexpectedTransactionHash: %s\nexpectedMessageToSign: %s\nnexpectedDescriptor: %s\nexpectedExtraParams: %s\nexpectedSignature: %s\nexpectedPublicKey: %s',
			async (
				mockBlock,
				expectedTransaction,
				expectedSeed,
				expectedAddress,
				expectedRlpEncodedTransaction,
				expectedTransactionHash,
				expectedMessageToSign,
				expectedDescriptor,
				expectedExtraParams,
				expectedSignature,
				expectedPublicKey,
			) => {
				// (i.e. requestManager, blockNumber, hydrated params), but that doesn't matter for the test
				jest.spyOn(qrlRpcMethods, 'estimateGas').mockImplementation(
					// @ts-expect-error - Mocked implementation doesn't have correct method signature
					() => expectedTransaction.gas,
				);
				// @ts-expect-error - Mocked implementation doesn't have correct method signature
				jest.spyOn(qrlRpcMethods, 'getBlockByNumber').mockImplementation(() => mockBlock);

				const qrljsTx = await prepareTransactionForSigning(
					expectedTransaction,
					web3Context,
					expectedSeed,
					true,
				);

				// should produce an web3-utils/tx instance
				expect(qrljsTx instanceof FeeMarketEIP1559Transaction).toBeTruthy();
				expect(qrljsTx.sign).toBeDefined();

				// should sign transaction
				const signedTransaction = qrljsTx.sign(hexToBytes(expectedSeed.substring(2)));

				const senderAddress = signedTransaction.getSenderAddress().toString();
				expect(senderAddress).toBe(`Q${expectedAddress.slice(1).toLowerCase()}`);

				// should be able to obtain expectedRlpEncodedTransaction
				const rlpEncodedTransaction = bytesToHex(signedTransaction.serialize());
				expect(rlpEncodedTransaction).toBe(expectedRlpEncodedTransaction);

				// should be able to obtain expectedTransactionHash
				const transactionHash = bytesToHex(signedTransaction.hash());
				expect(transactionHash).toBe(expectedTransactionHash);

				// should be able to obtain expectedMessageToSign
				const desc = signedTransaction.descriptor !== undefined ? signedTransaction.descriptor : Uint8Array.from([]);
				const messageToSign = bytesToHex(signedTransaction.getMessageToSign(desc));
				expect(messageToSign).toBe(expectedMessageToSign);

				// should have expected public key, signature and descriptor
				const descriptor = !isNullish(signedTransaction.descriptor)
					? bytesToHex(signedTransaction.descriptor)
					: '';
				const extraParams = !isNullish(signedTransaction.extraParams)
					? bytesToHex(signedTransaction.extraParams)
					: '';
				const signature = !isNullish(signedTransaction.signature)
					? bytesToHex(signedTransaction.signature)
					: '';
				const publicKey = !isNullish(signedTransaction.publicKey)
					? bytesToHex(signedTransaction.publicKey)
					: '';
				expect(descriptor).toBe(expectedDescriptor);
				expect(extraParams).toBe(expectedExtraParams);
				expect(signature).toBe(expectedSignature);
				expect(publicKey).toBe(expectedPublicKey);
			},
		);
	});
});
