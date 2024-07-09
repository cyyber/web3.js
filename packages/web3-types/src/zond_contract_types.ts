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

import { Address, Uint } from './zond_types.js';
import { SupportedProviders } from './web3_base_provider.js';
import { Bytes, HexString } from './primitives_types.js';
import { ZondExecutionAPI } from './apis/zond_execution_api.js';

export interface ContractInitOptions {
	/**
	 * The maximum gas provided for a transaction (gas limit).
	 */
	readonly gas?: Uint;
	readonly gasLimit?: Uint;
	maxPriorityFeePerGas?: string;
	maxFeePerGas?: string;
	/**
	 * The address transactions should be made from
	 */
	readonly from?: Address;
	/**
	 * The byte code of the contract. Used when the contract gets {@link Contract.deploy | deployed}
	 */
	readonly data?: Bytes;
	readonly input?: Bytes;

	readonly provider?: SupportedProviders<ZondExecutionAPI> | string;
	/**
	 * If `true`, the defaults of the contract instance will be updated automatically based on the changes of the context used to instantiate the contract.
	 */
	readonly syncWithContext?: boolean;

	readonly dataInputFill?: 'data' | 'input' | 'both';
	/**
	 * this will make calls default to `data`, `input` or `both`
	 */
}

export interface NonPayableCallOptions {
	nonce?: HexString;
	/**
	 * The address which is the call (the transaction) should be made from. For calls the `from` property is optional however it is
	 * highly recommended to explicitly set it or it may default to address(0) depending on your node or provider.
	 */
	from?: Address;
	/**
	 * The maximum gas (gas limit) provided for this call (this transaction)
	 */
	gas?: string;
	maxPriorityFeePerGas?: HexString;
	maxFeePerGas?: HexString;
	type?: string | number;
	data?: HexString;
	input?: HexString;
}

export interface PayableCallOptions extends NonPayableCallOptions {
	/**
	 *
	 */
	value?: string;
}
