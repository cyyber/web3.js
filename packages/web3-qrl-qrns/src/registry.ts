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

import { Web3ContextObject } from '@theqrl/web3-core';
import { TransactionRevertInstructionError } from '@theqrl/web3-errors';
import { Contract } from '@theqrl/web3-qrl-contract';
import { Address } from '@theqrl/web3-types';
import { isAddressString } from '@theqrl/web3-validator';
import { QRNSRegistryAbi } from './abi/qrns/QRNSRegistry.js';
import { PublicResolverAbi } from './abi/qrns/PublicResolver.js';
import { registryAddresses } from './config.js';
import { namehash } from './utils.js';

// A QRL address is 'Q' + 128 hex characters, so the zero address has 128 zeros.
const QRL_ZERO_ADDRESS = `Q${'0'.repeat(128)}`;

// Wrap a failed contract call in a typed error while preserving the original
// cause (message and error object) instead of discarding it in an empty Error.
const wrapContractCallError = (error: unknown): Error => {
	const cause = error instanceof Error ? error : new Error(String(error));
	const revertError = new TransactionRevertInstructionError(cause.message);
	revertError.innerError = cause;
	return revertError;
};

export class Registry {
	private readonly contract: Contract<typeof QRNSRegistryAbi>;
	private readonly context: Web3ContextObject;

	public constructor(context: Web3ContextObject, customRegistryAddress?: Address) {
		this.contract = new Contract(
			QRNSRegistryAbi,
			customRegistryAddress ?? registryAddresses.main,
			context,
		);

		this.context = context;
	}

	public async getOwner(name: string) {
		try {
			// Await inside the try so async rejections are actually caught here
			// rather than bypassing the catch block.
			return await this.contract.methods.owner(namehash(name)).call();
		} catch (error) {
			throw wrapContractCallError(error);
		}
	}

	public async getTTL(name: string) {
		try {
			return await this.contract.methods.ttl(namehash(name)).call();
		} catch (error) {
			throw wrapContractCallError(error);
		}
	}

	public async recordExists(name: string) {
		try {
			return await this.contract.methods.recordExists(namehash(name)).call();
		} catch (error) {
			throw wrapContractCallError(error);
		}
	}

	public async getResolver(name: string) {
		let address: unknown;
		try {
			// Await inside the try so a failed/reverted call surfaces a
			// cause-preserving typed error.
			address = await this.contract.methods.resolver(namehash(name)).call();
		} catch (error) {
			throw wrapContractCallError(error);
		}

		// Validation happens outside the try so the specific messages below are
		// not swallowed/re-wrapped as generic contract-call failures.
		if (typeof address !== 'string') {
			throw new Error('QRNS registry returned non-string resolver address');
		}
		if (!isAddressString(address)) {
			throw new Error(`QRNS registry returned invalid resolver address: ${address}`);
		}
		if (address.toLowerCase() === QRL_ZERO_ADDRESS.toLowerCase()) {
			throw new Error('QRNS registry returned zero resolver address');
		}
		return new Contract(PublicResolverAbi, address, this.context);
	}

	public get events() {
		return this.contract.events;
	}
}
