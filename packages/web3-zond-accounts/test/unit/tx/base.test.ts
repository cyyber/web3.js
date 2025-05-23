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
import { bytesToUint8Array, hexToBytes, uint8ArrayEquals } from '@theqrl/web3-utils';
import { Dilithium } from '@theqrl/wallet.js';
import { HexString } from '@theqrl/web3-types';
import { FeeMarketEIP1559Transaction } from '../../../src';
import { Chain, Common, Hardfork, toUint8Array, uint8ArrayToBigInt } from '../../../src/common';
import { MAX_INTEGER, MAX_UINT64 } from '../../../src/tx/constants';

import type { BaseTransaction } from '../../../src/tx/baseTransaction';
import eip1559Fixtures from '../../fixtures/json/eip1559txs.json';

const seedToPublic = function (seed: HexString): Uint8Array {
	const _seed = hexToBytes(seed);
	const buf = Buffer.from(_seed);
	const d = new Dilithium(buf);
	return d.getPK();
};
const common = new Common({
	chain: 1,
	hardfork: Hardfork.Shanghai,
});
// @ts-expect-error set private property
common._chainParams.chainId = 1;
describe('[BaseTransaction]', () => {
	// eslint-disable-next-line @typescript-eslint/no-shadow
	const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Shanghai });

	const eip1559Txs: BaseTransaction<FeeMarketEIP1559Transaction>[] = [];
	for (const tx of eip1559Fixtures) {
		eip1559Txs.push(FeeMarketEIP1559Transaction.fromTxData(tx.data, { common }));
	}

	const zero = new Uint8Array(0);
	const txTypes = [
		{
			class: FeeMarketEIP1559Transaction,
			name: 'FeeMarketEIP1559Transaction',
			type: 2,
			values: [new Uint8Array([1])].concat(Array(8).fill(zero)),
			txs: eip1559Txs,
			fixtures: eip1559Fixtures,
		},
	];

	it('Initialization', () => {
		for (const txType of txTypes) {
			let tx = txType.class.fromTxData({}, { common });
			expect(tx.common.hardfork()).toBe('shanghai');
			expect(Object.isFrozen(tx)).toBe(true);

			const initCommon = new Common({
				chain: Chain.Mainnet,
				hardfork: Hardfork.Shanghai,
			});
			tx = txType.class.fromTxData({}, { common: initCommon });
			expect(tx.common.hardfork()).toBe('shanghai');

			// NOTE(rgeraldes24): not valid since we don't have multiple forks
			// initCommon.setHardfork(Hardfork.Byzantium);
			// expect(tx.common.hardfork()).toBe('byzantium');

			tx = txType.class.fromTxData({}, { common, freeze: false });
			expect(!Object.isFrozen(tx)).toBe(true);

			// Perform the same test as above, but now using a different construction method. This also implies that passing on the
			// options object works as expected.
			tx = txType.class.fromTxData({}, { common, freeze: false });
			const rlpData = tx.serialize();

			tx = txType.class.fromSerializedTx(rlpData, { common });
			expect(tx.type).toEqual(txType.type);

			expect(Object.isFrozen(tx)).toBe(true);

			tx = txType.class.fromSerializedTx(rlpData, { common, freeze: false });
			expect(!Object.isFrozen(tx)).toBe(true);

			tx = txType.class.fromValuesArray(txType.values as any, { common });
			expect(Object.isFrozen(tx)).toBe(true);

			tx = txType.class.fromValuesArray(txType.values as any, { common, freeze: false });
			expect(!Object.isFrozen(tx)).toBe(true);
		}
	});

	it('fromValuesArray()', () => {
		const rlpData: any = eip1559Txs[0].raw();
		rlpData[2] = toUint8Array('0x0');
		expect(() => {
			FeeMarketEIP1559Transaction.fromValuesArray(rlpData);
		}).toThrow('maxPriorityFeePerGas cannot have leading zeroes');
	});

	it('serialize()', () => {
		for (const txType of txTypes) {
			for (const tx of txType.txs) {
				expect(txType.class.fromSerializedTx(tx.serialize(), { common })).toBeTruthy();
				expect(txType.class.fromSerializedTx(tx.serialize(), { common })).toBeTruthy();
			}
		}
	});

	it('raw()', () => {
		for (const txType of txTypes) {
			for (const tx of txType.txs) {
				expect(txType.class.fromValuesArray(tx.raw() as any, { common })).toBeTruthy();
			}
		}
	});

	it('verifySignature()', () => {
		for (const txType of txTypes) {
			for (const tx of txType.txs) {
				expect(tx.verifySignature()).toBe(true);
			}
		}
	});

	it('verifySignature() -> invalid', () => {
		for (const txType of txTypes) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			for (const txFixture of txType.fixtures.slice(0, 4)) {
				txFixture.data.signature = '0x01231412';
				const tx = txType.class.fromTxData(txFixture.data, { common });
				expect(tx.verifySignature()).toBe(false);
				expect(tx.validate(true)).toContain('Invalid Signature');
				expect(tx.validate()).toBe(false);
			}
		}
	});

	it('sign()', () => {
		for (const txType of txTypes) {
			for (const [i, tx] of txType.txs.entries()) {
				const { seed } = txType.fixtures[i];
				if (seed !== undefined) {
					// eslint-disable-next-line jest/no-conditional-expect
					expect(tx.sign(hexToBytes(seed))).toBeTruthy();
				}

				expect(() => tx.sign(new Uint8Array(bytesToUint8Array('invalid')))).toThrow();
			}
		}
	});

	it('isSigned() -> returns correct values', () => {
		for (const txType of txTypes) {
			const txs = [
				...txType.txs,
				// add unsigned variants
				...txType.txs.map(tx =>
					txType.class.fromTxData({
						...tx,
						publicKey: undefined,
						signature: undefined,
					}),
				),
			];
			for (const tx of txs) {
				expect(tx.isSigned()).toEqual(
					tx.publicKey !== undefined && tx.signature !== undefined,
				);
			}
		}
	});

	it('getSenderAddress()', () => {
		for (const txType of txTypes) {
			for (const [i, tx] of txType.txs.entries()) {
				const { seed, sendersAddress } = txType.fixtures[i];
				if (seed === undefined) {
					continue;
				}
				const signedTx = tx.sign(hexToBytes(seed));
				expect(signedTx.getSenderAddress().toString()).toBe(sendersAddress);
			}
		}
	});

	it('getSenderPublicKey()', () => {
		for (const txType of txTypes) {
			for (const [i, tx] of txType.txs.entries()) {
				const { seed } = txType.fixtures[i];
				if (seed === undefined) {
					continue;
				}
				const signedTx = tx.sign(hexToBytes(seed));
				const txPubKey = signedTx.getSenderPublicKey();

				const pubKeyFromSeed = seedToPublic(seed);
				expect(uint8ArrayEquals(txPubKey, pubKeyFromSeed)).toBe(true);
			}
		}
	});

	it('verifySignature()->valid', () => {
		for (const txType of txTypes) {
			for (const [i, tx] of txType.txs.entries()) {
				const { seed } = txType.fixtures[i];
				if (seed === undefined) {
					continue;
				}
				const signedTx = tx.sign(hexToBytes(seed));
				expect(signedTx.verifySignature()).toBeTruthy();
			}
		}
	});

	it('initialization with defaults', () => {
		const uInt8ArrayZero = toUint8Array('0x');
		const tx = FeeMarketEIP1559Transaction.fromTxData({
			nonce: '',
			gasLimit: '',
			maxFeePerGas: '',
			maxPriorityFeePerGas: '',
			to: '',
			value: '',
			data: '',
			publicKey: '',
			signature: '',
		});
		expect(tx.publicKey).toBeUndefined();
		expect(tx.signature).toBeUndefined();
		expect(tx.to).toBeUndefined();
		expect(tx.value).toBe(uint8ArrayToBigInt(uInt8ArrayZero));
		expect(tx.data).toEqual(uInt8ArrayZero);
		expect(tx.maxFeePerGas).toBe(uint8ArrayToBigInt(uInt8ArrayZero));
		expect(tx.maxPriorityFeePerGas).toBe(uint8ArrayToBigInt(uInt8ArrayZero));
		expect(tx.gasLimit).toBe(uint8ArrayToBigInt(uInt8ArrayZero));
		expect(tx.nonce).toBe(uint8ArrayToBigInt(uInt8ArrayZero));
	});

	it('_validateCannotExceedMaxInteger()', () => {
		const tx = FeeMarketEIP1559Transaction.fromTxData(eip1559Txs[0]);
		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			(tx as any)._validateCannotExceedMaxInteger({ a: MAX_INTEGER }, 256, true);
		}).toThrow('equal or exceed MAX_INTEGER');

		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			(tx as any)._validateCannotExceedMaxInteger({ a: MAX_INTEGER + BigInt(1) }, 256, false);
		}).toThrow('exceed MAX_INTEGER');

		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			(tx as any)._validateCannotExceedMaxInteger({ a: BigInt(0) }, 100, false);
		}).toThrow('unimplemented bits value');

		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			(tx as any)._validateCannotExceedMaxInteger({ a: MAX_UINT64 + BigInt(1) }, 64, false);
		}).toThrow('2^64');

		expect(() => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			(tx as any)._validateCannotExceedMaxInteger({ a: MAX_UINT64 }, 64, true);
		}).toThrow('2^64');
	});
});
