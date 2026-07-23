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
import { RLP } from '@ethereumjs/rlp';
import { bytesToHex, hexToBytes } from '@theqrl/web3-utils';
import { Chain, Common, Hardfork } from '../../../src/common';

import { FeeMarketEIP1559Transaction } from '../../../src';
import { newMLDSA87Descriptor } from '../../../src/qrl_wallet';

import testdata from '../../fixtures/json/eip1559.json';

const common = new Common({
	chain: 1,
	hardfork: Hardfork.Zond,
});
// @ts-expect-error set private property
common._chainParams.chainId = 4;
const TWO_POW256 = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000');

const validAddress = hexToBytes(
	'd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72',
);
const validSlot = hexToBytes('01'.repeat(32));
const chainId = BigInt(4);

describe('[FeeMarketEIP1559Transaction]', () => {
	it('cannot input decimal or negative values %s', () => {
		const values = [
			'maxFeePerGas',
			'maxPriorityFeePerGas',
			'chainId',
			'nonce',
			'gasLimit',
			'value',
			'descriptor',
			'extraParams',
			'signature',
			'publicKey',
		];
		const cases = [
			10.1,
			'10.1',
			'0xaa.1',
			-10.1,
			-1,
			BigInt(-10),
			'-100',
			'-10.1',
			'-0xaa',
			Infinity,
			-Infinity,
			NaN,
			{},
			true,
			false,
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			() => {},
			Number.MAX_SAFE_INTEGER + 1,
		];
		for (const value of values) {
			const txData: any = {};
			for (const testCase of cases) {
				if (
					value === 'chainId' &&
					((typeof testCase === 'number' && Number.isNaN(testCase)) || testCase === false)
				) {
					continue;
				}
				txData[value] = testCase;
				expect(() => {
					FeeMarketEIP1559Transaction.fromTxData(txData);
				}).toThrow();
			}
		}
	});

	it('getUpfrontCost()', () => {
		const tx = FeeMarketEIP1559Transaction.fromTxData(
			{
				maxFeePerGas: 10,
				maxPriorityFeePerGas: 8,
				gasLimit: 100,
				value: 6,
			},
			{ common },
		);
		expect(tx.getUpfrontCost()).toEqual(BigInt(806));
		let baseFee = BigInt(0);
		expect(tx.getUpfrontCost(baseFee)).toEqual(BigInt(806));
		baseFee = BigInt(4);
		expect(tx.getUpfrontCost(baseFee)).toEqual(BigInt(1006));
	});

	it('sign()', () => {
		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let index = 0; index < testdata.length; index += 1) {
			const data = testdata[index];
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			const seed = hexToBytes(data.seed.slice(2));
			const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common });
			const signed = txn.sign(seed);
			const rlpSerialized = RLP.encode(Uint8Array.from(signed.serialize()));
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			expect(rlpSerialized).toEqual(hexToBytes(data.signedTransactionRLP.slice(2)));
		}
	});

	it('hash()', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		let txn = FeeMarketEIP1559Transaction.fromTxData(data, { common });
		let signed = txn.sign(seed);
		const expectedHash = hexToBytes(
			'0x0236ff616f1edb4c48ae80dd55fc8434d9ff7af85583e2852544ab73ff7a406c',
		);
		expect(signed.hash()).toEqual(expectedHash);
		txn = FeeMarketEIP1559Transaction.fromTxData(data, { common, freeze: false });
		signed = txn.sign(seed);
		expect(signed.hash()).toEqual(expectedHash);
	});

	it('freeze property propagates from unsigned tx to signed tx', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common, freeze: false });
		expect(Object.isFrozen(txn)).toBe(false);
		const signedTxn = txn.sign(seed);
		expect(Object.isFrozen(signedTxn)).toBe(false);
	});

	// NOTE(rgeraldes24): test not valid atm: no qips available
	it.skip('common propagates from the common of tx, not the common in TxOptions', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common, freeze: false });
		const newCommon = new Common({
			chain: Chain.Mainnet,
			hardfork: Hardfork.Zond,
			qips: [2537],
		});
		expect(Object.isFrozen(newCommon)).not.toEqual(common);
		Object.defineProperty(txn, 'common', {
			get() {
				return newCommon;
			},
		});
		const signedTxn = txn.sign(seed);
		expect(signedTxn.common.qips()).toContain(2537);
	});

	it('unsigned tx -> getMessageToSign()', () => {
		const unsignedTx = FeeMarketEIP1559Transaction.fromTxData(
			{
				data: hexToBytes('010200'),
				to: validAddress,
				accessList: [[validAddress, [validSlot]]],
				chainId,
			},
			{ common },
		);
		const expectedHash = hexToBytes(
			'0x3ea83915d031514016d53877be424fb39e207a48341ca865f4bf8028ce4d336d',
		);
		const desc = newMLDSA87Descriptor();
		const extraParams = Uint8Array.from([]);
		expect(unsignedTx.getMessageToSign(desc.toBytes(), extraParams, true)).toEqual(
			expectedHash,
		);
		const expectedSerialization = hexToBytes(
			'0x02f8b90480808080b840d5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b728083010200f866f864b840d5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72e1a001010101010101010101010101010101010101010101010101010101010101018301000080',
		);
		expect(unsignedTx.getMessageToSign(desc.toBytes(), extraParams, false)).toEqual(
			expectedSerialization,
		);
	});

	it('toJSON()', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common });
		const signed = txn.sign(seed);

		const json = signed.toJSON();
		const { signature, publicKey, ...jsonWithoutCryptographicPayload } = json;
		expect(jsonWithoutCryptographicPayload).toEqual({
			chainId: '0x4',
			nonce: '0x333',
			maxPriorityFeePerGas: '0x1284d',
			maxFeePerGas: '0x1d97c',
			gasLimit: '0x8ae0',
			to: 'Qd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72',
			value: '0x2933bc9',
			data: '0x',
			accessList: [],
			descriptor: '0x010000',
			extraParams: undefined,
		});
		expect(signature).toBe(bytesToHex(signed.signature!));
		expect(publicKey).toBe(bytesToHex(signed.publicKey!));
	});

	it('Fee validation', () => {
		expect(() => {
			FeeMarketEIP1559Transaction.fromTxData(
				{
					maxFeePerGas: TWO_POW256 - BigInt(1),
					maxPriorityFeePerGas: 100,
					gasLimit: 1,
					value: 6,
				},
				{ common },
			);
		}).not.toThrow();
		expect(() => {
			FeeMarketEIP1559Transaction.fromTxData(
				{
					maxFeePerGas: TWO_POW256 - BigInt(1),
					maxPriorityFeePerGas: 100,
					gasLimit: 100,
					value: 6,
				},
				{ common },
			);
		}).toThrow();
		expect(() => {
			FeeMarketEIP1559Transaction.fromTxData(
				{
					maxFeePerGas: 1,
					maxPriorityFeePerGas: 2,
					gasLimit: 100,
					value: 6,
				},
				{ common },
			);
		}).toThrow();
	});
});
