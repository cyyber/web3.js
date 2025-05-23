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

import { Numbers } from '@theqrl/web3-types';
import { bytesToHex, toHex } from '@theqrl/web3-utils';
import { cryptoSignVerify } from '@theqrl/dilithium5';
import { Dilithium } from '@theqrl/wallet.js';
import { isAddressString } from '@theqrl/web3-validator';
import { MAX_INTEGER, MAX_UINT64, SEED_BYTES } from './constants.js';
import { Chain, Common, Hardfork, toUint8Array, uint8ArrayToBigInt } from '../common/index.js';
import type {
	FeeMarketEIP1559TxData,
	FeeMarketEIP1559ValuesArray,
	JsonTx,
	TxOptions,
} from './types.js';
import { Address } from './address.js';
import { checkMaxInitCodeSize } from './utils.js';

interface TransactionCache {
	hash: Uint8Array | undefined;
	dataFee?: {
		value: bigint;
		hardfork: string | Hardfork;
	};
}

/**
 * This base class will likely be subject to further
 * refactoring along the introduction of additional tx types
 * on the Zond network.
 *
 * It is therefore not recommended to use directly.
 */
export abstract class BaseTransaction<TransactionObject> {
	private readonly _type: number;

	public readonly nonce: bigint;
	public readonly gasLimit: bigint;
	public readonly to?: Address;
	public readonly value: bigint;
	public readonly data: Uint8Array;

	public readonly signature?: Uint8Array;
	public readonly publicKey?: Uint8Array;

	public readonly common!: Common;

	protected cache: TransactionCache = {
		hash: undefined,
		dataFee: undefined,
	};

	protected readonly txOptions: TxOptions;

	/**
	 * The default chain the tx falls back to if no Common
	 * is provided and if the chain can't be derived from
	 * a passed in chainId (only EIP-2718 typed txs) or
	 * EIP-155 signature (legacy txs).
	 *
	 * @hidden
	 */
	protected DEFAULT_CHAIN = Chain.Mainnet;

	/**
	 * The default HF if the tx type is active on that HF
	 * or the first greater HF where the tx is active.
	 *
	 * @hidden
	 */
	protected DEFAULT_HARDFORK: string | Hardfork = Hardfork.Shanghai;

	public constructor(txData: FeeMarketEIP1559TxData, opts: TxOptions) {
		const { nonce, gasLimit, to, value, data, signature, publicKey, type } = txData;
		this._type = Number(uint8ArrayToBigInt(toUint8Array(type)));

		this.txOptions = opts;

		let toB: Uint8Array;
		if (typeof to === 'string') {
			if (to === '') {
				toB = toUint8Array('0x');
			} else if (isAddressString(to)) {
				toB = toUint8Array(toHex(to));
			} else {
				throw new Error(
					`Cannot convert string to Uint8Array. only supports address strings and this string was given: ${to}`,
				);
			}
		} else {
			toB = toUint8Array(to);
		}

		const signatureB = toUint8Array(signature === '' ? '0x' : signature);
		const publicKeyB = toUint8Array(publicKey === '' ? '0x' : publicKey);

		this.nonce = uint8ArrayToBigInt(toUint8Array(nonce === '' ? '0x' : nonce));
		this.gasLimit = uint8ArrayToBigInt(toUint8Array(gasLimit === '' ? '0x' : gasLimit));
		this.to = toB.length > 0 ? new Address(toB) : undefined;
		this.value = uint8ArrayToBigInt(toUint8Array(value === '' ? '0x' : value));
		this.data = toUint8Array(data === '' ? '0x' : data);

		this.signature = signatureB.length > 0 ? signatureB : undefined;
		this.publicKey = publicKeyB.length > 0 ? publicKeyB : undefined;

		this._validateCannotExceedMaxInteger({ value: this.value });

		// gzond limits gasLimit to 2^64-1
		this._validateCannotExceedMaxInteger({ gasLimit: this.gasLimit }, 64);

		// EIP-2681 limits nonce to 2^64-1 (cannot equal 2^64-1)
		this._validateCannotExceedMaxInteger({ nonce: this.nonce }, 64, true);
		// eslint-disable-next-line no-null/no-null
		const createContract = this.to === undefined || this.to === null;
		const allowUnlimitedInitCodeSize = opts.allowUnlimitedInitCodeSize ?? false;
		const common = opts.common ?? this._getCommon();
		if (createContract && !allowUnlimitedInitCodeSize) {
			checkMaxInitCodeSize(common, this.data.length);
		}
	}

	/**
	 * Returns the transaction type.
	 */
	public get type() {
		return this._type;
	}

	/**
	 * Checks if the transaction has the minimum amount of gas required
	 * (DataFee + TxFee + Creation Fee).
	 */
	public validate(): boolean;
	public validate(stringError: false): boolean;
	public validate(stringError: true): string[];
	public validate(stringError = false): boolean | string[] {
		const errors = [];

		if (this.getBaseFee() > this.gasLimit) {
			errors.push(
				`gasLimit is too low. given ${this.gasLimit}, need at least ${this.getBaseFee()}`,
			);
		}

		if (this.isSigned() && !this.verifySignature()) {
			errors.push('Invalid Signature');
		}

		return stringError ? errors : errors.length === 0;
	}

	/**
	 * The minimum amount of gas the tx must have (DataFee + TxFee + Creation Fee)
	 */
	public getBaseFee(): bigint {
		const txFee = this.common.param('gasPrices', 'tx');
		let fee = this.getDataFee();
		if (txFee) fee += txFee;
		if (this.toCreationAddress()) {
			const txCreationFee = this.common.param('gasPrices', 'txCreation');
			if (txCreationFee) fee += txCreationFee;
		}
		return fee;
	}

	/**
	 * The amount of gas paid for the data in this tx
	 */
	public getDataFee(): bigint {
		const txDataZero = this.common.param('gasPrices', 'txDataZero');
		const txDataNonZero = this.common.param('gasPrices', 'txDataNonZero');

		let cost = BigInt(0);
		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let i = 0; i < this.data.length; i += 1) {
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
			this.data[i] === 0 ? (cost += txDataZero) : (cost += txDataNonZero);
		}
		// eslint-disable-next-line no-null/no-null
		if (this.to === undefined || this.to === null) {
			const dataLength = BigInt(Math.ceil(this.data.length / 32));
			const initCodeCost = this.common.param('gasPrices', 'initCodeWordCost') * dataLength;
			cost += initCodeCost;
		}

		return cost;
	}

	/**
	 * The up front amount that an account must have for this transaction to be valid
	 */
	public abstract getUpfrontCost(): bigint;

	/**
	 * If the tx's `to` is to the creation address
	 */
	public toCreationAddress(): boolean {
		return this.to === undefined || this.to.buf.length === 0;
	}

	/**
	 * Returns a Uint8Array Array of the raw Uint8Arrays of this transaction, in order.
	 *
	 * Use {@link BaseTransaction.serialize} to add a transaction to a block
	 * with {@link Block.fromValuesArray}.
	 *
	 * For an unsigned tx this method uses the empty Uint8Array values for the
	 * signature parameters `publicKey` and `signature` for encoding. For an EIP-155 compliant
	 * representation for external signing use {@link BaseTransaction.getMessageToSign}.
	 */
	public abstract raw(): FeeMarketEIP1559ValuesArray;

	/**
	 * Returns the encoding of the transaction.
	 */
	public abstract serialize(): Uint8Array;

	// Returns the unsigned tx (hashed or raw), which is used to sign the transaction.
	//
	// Note: do not use code docs here since VS Studio is then not able to detect the
	// comments from the inherited methods
	public abstract getMessageToSign(hashMessage: false): Uint8Array | Uint8Array[];
	public abstract getMessageToSign(hashMessage?: true): Uint8Array;

	public abstract hash(): Uint8Array;

	public abstract getMessageToVerifySignature(): Uint8Array;

	public isSigned(): boolean {
		const { signature, publicKey } = this;
		if (signature === undefined || publicKey === undefined) {
			return false;
		}
		return true;
	}

	/**
	 * Determines if the signature is valid
	 */
	public verifySignature(): boolean {
		const msgHash = this.getMessageToVerifySignature();
		const { publicKey, signature } = this;
		const sigBuf = Buffer.from(signature!);
		const pubKeyBuf = Buffer.from(publicKey!);
		const msgHashBuf = Buffer.from(msgHash);

		try {
			return cryptoSignVerify(sigBuf, msgHashBuf, pubKeyBuf);
		} catch (e: any) {
			return false;
		}
	}

	/**
	 * Returns the sender's address
	 */
	public getSenderAddress(): Address {
		const { publicKey } = this;
		return new Address(Address.publicToAddress(publicKey!));
	}

	/**
	 * Returns the public key of the sender
	 */
	public abstract getSenderPublicKey(): Uint8Array;

	/**
	 * Signs a transaction.
	 *
	 * Note that the signed tx is returned as a new object,
	 * use as follows:
	 * ```javascript
	 * const signedTx = tx.sign(privateKey, publicKey)
	 * ```
	 */
	public sign(seed: Uint8Array): TransactionObject {
		if (seed.length !== SEED_BYTES) {
			const msg = this._errorMsg(`Seed must be ${SEED_BYTES} bytes in length.`);
			throw new Error(msg);
		}

		const msgHash = this.getMessageToSign(true);
		const buf = Buffer.from(seed);
		const acc = new Dilithium(buf);
		const signature = acc.sign(msgHash);
		const tx = this._processSignatureAndPublicKey(signature, acc.getPK());

		return tx;
	}

	/**
	 * Returns an object with the JSON representation of the transaction
	 */
	public abstract toJSON(): JsonTx;

	// Accept the signature and public key values from the `sign` method, and convert this into a TransactionObject
	protected abstract _processSignatureAndPublicKey(
		signature: Uint8Array,
		publicKey: Uint8Array,
	): TransactionObject;

	/**
	 * Does chain ID checks on common and returns a common
	 * to be used on instantiation
	 * @hidden
	 *
	 * @param common - {@link Common} instance from tx options
	 * @param chainId - Chain ID from tx options (typed txs) or signature (legacy tx)
	 */
	protected _getCommon(common?: Common, chainId?: Numbers) {
		// Chain ID provided
		if (chainId !== undefined) {
			const chainIdBigInt = uint8ArrayToBigInt(toUint8Array(chainId));
			if (common) {
				if (common.chainId() !== chainIdBigInt) {
					const msg = this._errorMsg(
						'The chain ID does not match the chain ID of Common',
					);
					throw new Error(msg);
				}
				// Common provided, chain ID does match
				// -> Return provided Common
				return common.copy();
			}
			if (Common.isSupportedChainId(chainIdBigInt)) {
				// No Common, chain ID supported by Common
				// -> Instantiate Common with chain ID
				return new Common({ chain: chainIdBigInt, hardfork: this.DEFAULT_HARDFORK });
			}
			// No Common, chain ID not supported by Common
			// -> Instantiate custom Common derived from DEFAULT_CHAIN
			return Common.custom(
				{
					name: 'custom-chain',
					networkId: chainIdBigInt,
					chainId: chainIdBigInt,
				},
				{ baseChain: this.DEFAULT_CHAIN, hardfork: this.DEFAULT_HARDFORK },
			);
		}
		// No chain ID provided
		// -> return Common provided or create new default Common
		return (
			common?.copy() ??
			new Common({ chain: this.DEFAULT_CHAIN, hardfork: this.DEFAULT_HARDFORK })
		);
	}

	/**
	 * Validates that an object with BigInt values cannot exceed the specified bit limit.
	 * @param values Object containing string keys and BigInt values
	 * @param bits Number of bits to check (64 or 256)
	 * @param cannotEqual Pass true if the number also cannot equal one less the maximum value
	 */
	protected _validateCannotExceedMaxInteger(
		values: { [key: string]: bigint | undefined },
		bits = 256,
		cannotEqual = false,
	) {
		for (const [key, value] of Object.entries(values)) {
			switch (bits) {
				case 64:
					if (cannotEqual) {
						if (value !== undefined && value >= MAX_UINT64) {
							const msg = this._errorMsg(
								`${key} cannot equal or exceed MAX_UINT64 (2^64-1), given ${value}`,
							);
							throw new Error(msg);
						}
					} else if (value !== undefined && value > MAX_UINT64) {
						const msg = this._errorMsg(
							`${key} cannot exceed MAX_UINT64 (2^64-1), given ${value}`,
						);
						throw new Error(msg);
					}
					break;
				case 256:
					if (cannotEqual) {
						if (value !== undefined && value >= MAX_INTEGER) {
							const msg = this._errorMsg(
								`${key} cannot equal or exceed MAX_INTEGER (2^256-1), given ${value}`,
							);
							throw new Error(msg);
						}
					} else if (value !== undefined && value > MAX_INTEGER) {
						const msg = this._errorMsg(
							`${key} cannot exceed MAX_INTEGER (2^256-1), given ${value}`,
						);
						throw new Error(msg);
					}
					break;
				default: {
					const msg = this._errorMsg('unimplemented bits value');
					throw new Error(msg);
				}
			}
		}
	}

	protected static _validateNotArray(values: { [key: string]: any }) {
		const txDataKeys = [
			'nonce',
			'gasLimit',
			'to',
			'value',
			'data',
			'type',
			'baseFee',
			'maxFeePerGas',
			'chainId',
		];
		for (const [key, value] of Object.entries(values)) {
			if (txDataKeys.includes(key)) {
				if (Array.isArray(value)) {
					throw new Error(`${key} cannot be an array`);
				}
			}
		}
	}

	/**
	 * Return a compact error string representation of the object
	 */
	public abstract errorStr(): string;

	/**
	 * Internal helper function to create an annotated error message
	 *
	 * @param msg Base error message
	 * @hidden
	 */
	protected abstract _errorMsg(msg: string): string;

	/**
	 * Returns the shared error postfix part for _error() method
	 * tx type implementations.
	 */
	protected _getSharedErrorPostfix() {
		let hash = '';
		try {
			hash = this.isSigned() ? bytesToHex(this.hash()) : 'not available (unsigned)';
		} catch (e: any) {
			hash = 'error';
		}
		let isSigned = '';
		try {
			isSigned = this.isSigned().toString();
		} catch (e: any) {
			hash = 'error';
		}
		let hf = '';
		try {
			hf = this.common.hardfork();
		} catch (e: any) {
			hf = 'error';
		}

		let postfix = `tx type=${this.type} hash=${hash} nonce=${this.nonce} value=${this.value} `;
		postfix += `signed=${isSigned} hf=${hf}`;

		return postfix;
	}
}
