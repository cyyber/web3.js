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

import { QRL_DATA_FORMAT, FormatType, Transaction } from '@theqrl/web3-types';

const baseTx = {
	from: 'QdBb14ea952DfAedB0788Beae4fD92393f215CAa2c115ac22bc68805E171cfadE76CFF540c1ADC7B13017E4c66b6109135f25ff73412650da569E458E4A43800b',
	to: 'QFcAc5a47dc5363999c60BC3b4288720E870a423A1383F00cFaa9E1135a60E43eA809688917A789EE0BDd6828dB2dcd848Bc632c28023794f8187af3Bac5DB018',
	value: '0x174876e800',
	gas: '0x5208',
	data: '0x0',
	nonce: '0x4',
	chainId: '0x1',
	gasLimit: '0x5208',
} as const;

export const transactionType0x2: FormatType<Transaction, typeof QRL_DATA_FORMAT>[] = [
	{
		...baseTx,
		type: '0x2',
	},
	{
		...baseTx,
		maxFeePerGas: '0x1229298c00',
	},
	{
		...baseTx,
		maxPriorityFeePerGas: '0x49504f80',
	},
	{
		...baseTx,
		common: {
			customChain: {
				networkId: '0x42',
				chainId: '0x42',
			},
			hardfork: 'zond',
		},
	},
	{
		...baseTx,
		hardfork: 'zond',
	},
];

export const transactionTypeUndefined: FormatType<Transaction, typeof QRL_DATA_FORMAT>[] = [
	{
		...baseTx,
		data: '0x',
	},
	{
		...baseTx,
		data: '0x',
	},
];

export const transactionTypeUnsupportedHardfork: FormatType<
	Transaction,
	typeof QRL_DATA_FORMAT
>[] = [
	{
		...baseTx,
		data: '0x',
		// @ts-expect-error Hardfork doesn't exist
		hardfork: 'nonExistent',
	},
	{
		...baseTx,
		data: '0x',
		common: {
			customChain: {
				networkId: '0x42',
				chainId: '0x42',
			},
			// @ts-expect-error Hardfork doesn't exist
			hardfork: 'istanbul',
		},
	},
];
