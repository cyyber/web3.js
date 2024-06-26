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
import { keccak256 } from 'ethereum-cryptography/keccak.js';
import { validateNoLeadingZeroes } from '@theqrl/web3-validator';
import { RLP } from '@ethereumjs/rlp';
import { bytesToHex, hexToBytes, uint8ArrayConcat, uint8ArrayEquals } from '@theqrl/web3-utils';
import { MAX_INTEGER } from './constants.js';
import {
	getAccessListData,
	verifyAccessList,
	getAccessListJSON,
	getDataFeeEIP2930,
} from './utils.js';
import {
	bigIntToHex,
	toUint8Array,
	uint8ArrayToBigInt,
	bigIntToUnpaddedUint8Array,
} from '../common/utils.js';
import { BaseTransaction } from './baseTransaction.js';
import type {
	AccessList,
	AccessListUint8Array,
	AccessListEIP2930TxData,
	AccessListEIP2930ValuesArray,
	JsonTx,
	TxOptions,
} from './types.js';
import type { Common } from '../common/common.js';

const TRANSACTION_TYPE = 1;
const TRANSACTION_TYPE_UINT8ARRAY = hexToBytes(TRANSACTION_TYPE.toString(16).padStart(2, '0'));

/**
 * Typed transaction with optional access lists
 *
 * - TransactionType: 1
 * - EIP: [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930)
 */
// eslint-disable-next-line no-use-before-define
export class AccessListEIP2930Transaction extends BaseTransaction<AccessListEIP2930Transaction> {
	public readonly chainId: bigint;
	public readonly accessList: AccessListUint8Array;
	public readonly AccessListJSON: AccessList;
	public readonly gasPrice: bigint;

	public readonly common: Common;

	/**
	 * The default HF if the tx type is active on that HF
	 * or the first greater HF where the tx is active.
	 *
	 * @hidden
	 */
	protected DEFAULT_HARDFORK = 'shanghai';

	/**
	 * Instantiate a transaction from a data dictionary.
	 *
	 * Format: { chainId, nonce, gasPrice, gasLimit, to, value, data, accessList,
	 * signature, publicKey }
	 *
	 * Notes:
	 * - `chainId` will be set automatically if not provided
	 * - All parameters are optional and have some basic default values
	 */
	public static fromTxData(txData: AccessListEIP2930TxData, opts: TxOptions = {}) {
		return new AccessListEIP2930Transaction(txData, opts);
	}

	/**
	 * Instantiate a transaction from the serialized tx.
	 *
	 * Format: `0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList,
	 * signatureYParity (v), signatureR (r), signatureS (s)])`
	 */
	public static fromSerializedTx(serialized: Uint8Array, opts: TxOptions = {}) {
		if (!uint8ArrayEquals(serialized.subarray(0, 1), TRANSACTION_TYPE_UINT8ARRAY)) {
			throw new Error(
				`Invalid serialized tx input: not an EIP-2930 transaction (wrong tx type, expected: ${TRANSACTION_TYPE}, received: ${bytesToHex(
					serialized.subarray(0, 1),
				)}`,
			);
		}
		const values = RLP.decode(Uint8Array.from(serialized.subarray(1)));

		if (!Array.isArray(values)) {
			throw new Error('Invalid serialized tx input: must be array');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return AccessListEIP2930Transaction.fromValuesArray(values as any, opts);
	}

	/**
	 * Create a transaction from a values array.
	 *
	 * Format: `[chainId, nonce, gasPrice, gasLimit, to, value, data, accessList,
	 * publicKey, signature]`
	 */
	public static fromValuesArray(values: AccessListEIP2930ValuesArray, opts: TxOptions = {}) {
		if (values.length !== 8 && values.length !== 10) {
			throw new Error(
				'Invalid EIP-2930 transaction. Only expecting 8 values (for unsigned tx) or 10 values (for signed tx).',
			);
		}

		const [chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, publicKey, signature] = values;

		this._validateNotArray({ chainId });
		validateNoLeadingZeroes({ nonce, gasPrice, gasLimit, value, publicKey, signature });

		const emptyAccessList: AccessList = [];

		return new AccessListEIP2930Transaction(
			{
				chainId: uint8ArrayToBigInt(chainId),
				nonce,
				gasPrice,
				gasLimit,
				to,
				value,
				data,
				accessList: accessList ?? emptyAccessList,
				publicKey,
				signature,
			},
			opts,
		);
	}

	/**
	 * This constructor takes the values, validates them, assigns them and freezes the object.
	 *
	 * It is not recommended to use this constructor directly. Instead use
	 * the static factory methods to assist in creating a Transaction object from
	 * varying data types.
	 */
	public constructor(txData: AccessListEIP2930TxData, opts: TxOptions = {}) {
		super({ ...txData, type: TRANSACTION_TYPE }, opts);
		const { chainId, accessList, gasPrice } = txData;

		this.common = this._getCommon(opts.common, chainId);
		this.chainId = this.common.chainId();

		this.activeCapabilities = this.activeCapabilities.concat([2718, 2930]);

		// Populate the access list fields
		const accessListData = getAccessListData(accessList ?? []);
		this.accessList = accessListData.accessList;
		this.AccessListJSON = accessListData.AccessListJSON;
		// Verify the access list format.
		verifyAccessList(this.accessList);

		this.gasPrice = uint8ArrayToBigInt(toUint8Array(gasPrice === '' ? '0x' : gasPrice));

		this._validateCannotExceedMaxInteger({
			gasPrice: this.gasPrice,
		});

		BaseTransaction._validateNotArray(txData);

		if (this.gasPrice * this.gasLimit > MAX_INTEGER) {
			const msg = this._errorMsg('gasLimit * gasPrice cannot exceed MAX_INTEGER');
			throw new Error(msg);
		}

		const freeze = opts?.freeze ?? true;
		if (freeze) {
			Object.freeze(this);
		}
	}

	/**
	 * The amount of gas paid for the data in this tx
	 */
	public getDataFee(): bigint {
		if (this.cache.dataFee && this.cache.dataFee.hardfork === this.common.hardfork()) {
			return this.cache.dataFee.value;
		}

		let cost = super.getDataFee();
		cost += BigInt(getDataFeeEIP2930(this.accessList, this.common));

		if (Object.isFrozen(this)) {
			this.cache.dataFee = {
				value: cost,
				hardfork: this.common.hardfork(),
			};
		}

		return cost;
	}

	/**
	 * The up front amount that an account must have for this transaction to be valid
	 */
	public getUpfrontCost(): bigint {
		return this.gasLimit * this.gasPrice + this.value;
	}

	/**
	 * Returns a Uint8Array Array of the raw Uint8Arrays of the EIP-2930 transaction, in order.
	 *
	 * Format: `[chainId, nonce, gasPrice, gasLimit, to, value, data, accessList,
	 * signatureYParity (v), signatureR (r), signatureS (s)]`
	 *
	 * Use {@link AccessListEIP2930Transaction.serialize} to add a transaction to a block
	 * with {@link Block.fromValuesArray}.
	 *
	 * For an unsigned tx this method uses the empty UINT8ARRAY values for the
	 * signature parameters `v`, `r` and `s` for encoding. For an EIP-155 compliant
	 * representation for external signing use {@link AccessListEIP2930Transaction.getMessageToSign}.
	 */
	public raw(): AccessListEIP2930ValuesArray {
		return [
			bigIntToUnpaddedUint8Array(this.chainId),
			bigIntToUnpaddedUint8Array(this.nonce),
			bigIntToUnpaddedUint8Array(this.gasPrice),
			bigIntToUnpaddedUint8Array(this.gasLimit),
			this.to !== undefined ? this.to.buf : Uint8Array.from([]),
			bigIntToUnpaddedUint8Array(this.value),
			this.data,
			this.accessList,
			this.publicKey !== undefined ? this.publicKey : Uint8Array.from([]),
			this.signature !== undefined ? this.signature : Uint8Array.from([]),
		];
	}

	/**
	 * Returns the serialized encoding of the EIP-2930 transaction.
	 *
	 * Format: `0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList,
	 * signatureYParity (v), signatureR (r), signatureS (s)])`
	 *
	 * Note that in contrast to the legacy tx serialization format this is not
	 * valid RLP any more due to the raw tx type preceding and concatenated to
	 * the RLP encoding of the values.
	 */
	public serialize(): Uint8Array {
		const base = this.raw();
		return uint8ArrayConcat(TRANSACTION_TYPE_UINT8ARRAY, RLP.encode(base));
	}

	/**
	 * Returns the serialized unsigned tx (hashed or raw), which can be used
	 * to sign the transaction (e.g. for sending to a hardware wallet).
	 *
	 * Note: in contrast to the legacy tx the raw message format is already
	 * serialized and doesn't need to be RLP encoded any more.
	 *
	 * ```javascript
	 * const serializedMessage = tx.getMessageToSign(false) // use this for the HW wallet input
	 * ```
	 *
	 * @param hashMessage - Return hashed message if set to true (default: true)
	 */
	public getMessageToSign(hashMessage = true): Uint8Array {
		const base = this.raw().slice(0, 8);
		const message = uint8ArrayConcat(TRANSACTION_TYPE_UINT8ARRAY, RLP.encode(base));
		if (hashMessage) {
			return keccak256(message);
		}
		return message;
	}

	/**
	 * Computes a sha3-256 hash of the serialized tx.
	 *
	 * This method can only be used for signed txs (it throws otherwise).
	 * Use {@link AccessListEIP2930Transaction.getMessageToSign} to get a tx hash for the purpose of signing.
	 */
	public hash(): Uint8Array {
		if (!this.isSigned()) {
			const msg = this._errorMsg('Cannot call hash method if transaction is not signed');
			throw new Error(msg);
		}

		if (Object.isFrozen(this)) {
			if (!this.cache.hash) {
				this.cache.hash = keccak256(this.serialize());
			}
			return this.cache.hash;
		}

		return keccak256(this.serialize());
	}

	/**
	 * Computes a sha3-256 hash which can be used to verify the signature
	 */
	public getMessageToVerifySignature(): Uint8Array {
		return this.getMessageToSign();
	}

	/**
	 * Returns the public key of the sender
	 */
	public getSenderPublicKey(): Uint8Array {
		if (!this.isSigned()) {
			const msg = this._errorMsg('Cannot call this method if transaction is not signed');
			throw new Error(msg);
		}

		return this.publicKey!;
	}

	public _processSignatureAndPublicKey(signature: Uint8Array, publicKey: Uint8Array) {
		const opts = { ...this.txOptions, common: this.common };

		return AccessListEIP2930Transaction.fromTxData(
			{
				chainId: this.chainId,
				nonce: this.nonce,
				gasPrice: this.gasPrice,
				gasLimit: this.gasLimit,
				to: this.to,
				value: this.value,
				data: this.data,
				accessList: this.accessList,
				publicKey: publicKey,
				signature: signature,
			},
			opts,
		);
	}

	/**
	 * Returns an object with the JSON representation of the transaction
	 */
	public toJSON(): JsonTx {
		const accessListJSON = getAccessListJSON(this.accessList);

		return {
			chainId: bigIntToHex(this.chainId),
			nonce: bigIntToHex(this.nonce),
			gasPrice: bigIntToHex(this.gasPrice),
			gasLimit: bigIntToHex(this.gasLimit),
			to: this.to !== undefined ? this.to.toString() : undefined,
			value: bigIntToHex(this.value),
			data: bytesToHex(this.data),
			accessList: accessListJSON,
			publicKey: this.publicKey !== undefined ? bytesToHex(this.publicKey) : undefined,
			signature: this.signature !== undefined ? bytesToHex(this.signature) : undefined,
		};
	}

	/**
	 * Return a compact error string representation of the object
	 */
	public errorStr() {
		let errorStr = this._getSharedErrorPostfix();
		// Keep ? for this.accessList since this otherwise causes Hardhat E2E tests to fail
		errorStr += ` gasPrice=${this.gasPrice} accessListCount=${this.accessList?.length ?? 0}`;
		return errorStr;
	}

	/**
	 * Internal helper function to create an annotated error message
	 *
	 * @param msg Base error message
	 * @hidden
	 */
	protected _errorMsg(msg: string) {
		return `${msg} (${this.errorStr()})`;
	}
}
