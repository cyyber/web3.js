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
export const accessListItemSchema = {
	type: 'object',
	properties: {
		address: {
			format: 'address',
		},
		storageKeys: {
			type: 'array',
			items: {
				format: 'bytes32',
			},
		},
	},
};

export const accessListSchema = {
	type: 'array',
	items: {
		...accessListItemSchema,
	},
};

export const accessListResultSchema = {
	type: 'object',
	properties: {
		accessList: {
			...accessListSchema,
		},
		gasUsed: {
			type: 'string',
		},
	},
};

export const chainSchema = {
	type: 'string',
	enum: ['mainnet'],
};

export const hardforkSchema = {
	type: 'string',
	enum: ['shanghai'],
};

export const customChainSchema = {
	type: 'object',
	properties: {
		name: {
			format: 'string',
		},
		networkId: {
			format: 'uint',
		},
		chainId: {
			format: 'uint',
		},
	},
};

export const transactionSchema = {
	type: 'object',
	properties: {
		from: {
			format: 'address',
		},
		to: {
			oneOf: [{ format: 'address' }, { type: 'null' }],
		},
		value: {
			format: 'uint',
		},
		gas: {
			format: 'uint',
		},
		effectiveGasPrice: {
			format: 'uint',
		},
		type: {
			format: 'uint',
		},
		maxFeePerGas: {
			format: 'uint',
		},
		maxPriorityFeePerGas: {
			format: 'uint',
		},
		accessList: {
			...accessListSchema,
		},
		data: {
			format: 'bytes',
		},
		input: {
			format: 'bytes',
		},
		nonce: {
			format: 'uint',
		},
		chain: { ...chainSchema },
		hardfork: { ...hardforkSchema },
		chainId: {
			format: 'uint',
		},
		networkId: {
			format: 'uint',
		},
		common: {
			type: 'object',
			properties: {
				customChain: { ...customChainSchema },
				baseChain: {
					...chainSchema,
				},
				hardfork: {
					...hardforkSchema,
				},
			},
		},
		gasLimit: {
			format: 'uint',
		},
		publicKey: {
			format: 'bytes',
		},
		signature: {
			format: 'bytes',
		},
	},
};

export const transactionInfoSchema = {
	type: 'object',
	properties: {
		...transactionSchema.properties,
		blockHash: {
			format: 'bytes32',
		},
		blockNumber: {
			format: 'uint',
		},
		hash: {
			format: 'bytes32',
		},
		transactionIndex: {
			format: 'uint',
		},
		from: {
			format: 'address',
		},
		to: {
			oneOf: [{ format: 'address' }, { type: 'null' }],
		},
		value: {
			format: 'uint',
		},
		gas: {
			format: 'uint',
		},
		effectiveGasPrice: {
			format: 'uint',
		},
		type: {
			format: 'uint',
		},
		maxFeePerGas: {
			format: 'uint',
		},
		maxPriorityFeePerGas: {
			format: 'uint',
		},
		accessList: {
			...accessListSchema,
		},
		data: {
			format: 'bytes',
		},
		input: {
			format: 'bytes',
		},
		nonce: {
			format: 'uint',
		},
		gasLimit: {
			format: 'uint',
		},
		publicKey: {
			format: 'bytes',
		},
		signature: {
			format: 'bytes',
		},
	},
};

export const blockSchema = {
	type: 'object',
	properties: {
		parentHash: {
			format: 'bytes32',
		},
		miner: {
			format: 'address',
		},
		stateRoot: {
			format: 'bytes32',
		},
		transactionsRoot: {
			format: 'bytes32',
		},
		receiptsRoot: {
			format: 'bytes32',
		},
		logsBloom: {
			format: 'bytes256',
		},
		number: {
			format: 'uint',
		},
		gasLimit: {
			format: 'uint',
		},
		gasUsed: {
			format: 'uint',
		},
		timestamp: {
			format: 'uint',
		},
		extraData: {
			format: 'bytes',
		},
		prevRandao: {
			format: 'bytes32',
		},
		baseFeePerGas: {
			format: 'uint',
		},
		size: {
			format: 'uint',
		},
		transactions: {
			oneOf: [
				{
					type: 'array',
					items: {
						...transactionInfoSchema,
					},
				},
				{
					type: 'array',
					items: {
						format: 'bytes32',
					},
				},
			],
		},
		hash: {
			format: 'bytes32',
		},
	},
};

export const withdrawalsSchema = {
	type: 'object',
	properties: {
		index: {
			format: 'uint',
		},
		validatorIndex: {
			format: 'uint',
		},
		address: {
			format: 'bytes32',
		},
		amount: {
			format: 'uint',
		},
	},
};

export const blockHeaderSchema = {
	type: 'object',
	properties: {
		author: {
			format: 'bytes32',
		},
		hash: {
			format: 'bytes32',
		},
		parentHash: {
			format: 'bytes32',
		},
		receiptsRoot: {
			format: 'bytes32',
		},
		miner: {
			format: 'bytes',
		},
		stateRoot: {
			format: 'bytes32',
		},
		transactionsRoot: {
			format: 'bytes32',
		},
		withdrawalsRoot: {
			format: 'bytes32',
		},
		logsBloom: {
			format: 'bytes256',
		},
		number: {
			format: 'uint',
		},
		gasLimit: {
			format: 'uint',
		},
		gasUsed: {
			format: 'uint',
		},
		timestamp: {
			format: 'uint',
		},
		extraData: {
			format: 'bytes',
		},
		size: {
			format: 'uint',
		},
		baseFeePerGas: {
			format: 'uint',
		},
		excessDataGas: {
			format: 'uint',
		},
		prevRandao: {
			format: 'bytes32',
		},
		transactions: {
			type: 'array',
			items: {
				format: 'bytes32',
			},
		},
		withdrawals: {
			type: 'array',
			items: {
				...withdrawalsSchema,
			},
		},
	},
};

export const logSchema = {
	type: 'object',
	properties: {
		removed: {
			format: 'bool',
		},
		logIndex: {
			format: 'uint',
		},
		transactionIndex: {
			format: 'uint',
		},
		transactionHash: {
			format: 'bytes32',
		},
		blockHash: {
			format: 'bytes32',
		},
		blockNumber: {
			format: 'uint',
		},
		address: {
			format: 'address',
		},
		data: {
			format: 'bytes',
		},
		topics: {
			type: 'array',
			items: {
				format: 'bytes32',
			},
		},
	},
};
export const syncSchema = {
	type: 'object',
	properties: {
		startingBlock: {
			format: 'string',
		},
		currentBlock: {
			format: 'string',
		},
		highestBlock: {
			format: 'string',
		},
		knownStates: {
			format: 'string',
		},
		pulledStates: {
			format: 'string',
		},
	},
};

export const transactionReceiptSchema = {
	type: 'object',
	properties: {
		transactionHash: {
			format: 'bytes32',
		},
		transactionIndex: {
			format: 'uint',
		},
		blockHash: {
			format: 'bytes32',
		},
		blockNumber: {
			format: 'uint',
		},
		from: {
			format: 'address',
		},
		to: {
			format: 'address',
		},
		cumulativeGasUsed: {
			format: 'uint',
		},
		gasUsed: {
			format: 'uint',
		},
		effectiveGasPrice: {
			format: 'uint',
		},
		contractAddress: {
			format: 'address',
		},
		logs: {
			type: 'array',
			items: {
				...logSchema,
			},
		},
		logsBloom: {
			format: 'bytes',
		},
		root: {
			format: 'bytes',
		},
		status: {
			format: 'uint',
		},
		type: {
			format: 'uint',
		},
	},
};

export const SignatureObjectSchema = {
	type: 'object',
	properties: {
		messageHash: {
			format: 'bytes',
		},
		message: {
			format: 'bytes',
		},
		signature: {
			format: 'bytes',
		},
	},
};
export const feeHistorySchema = {
	type: 'object',
	properties: {
		oldestBlock: {
			format: 'uint',
		},
		baseFeePerGas: {
			type: 'array',
			items: {
				format: 'uint',
			},
		},
		reward: {
			type: 'array',
			items: {
				type: 'array',
				items: {
					format: 'uint',
				},
			},
		},
		gasUsedRatio: {
			type: 'array',
			items: {
				type: 'number',
			},
		},
	},
};

export const storageProofSchema = {
	type: 'object',
	properties: {
		key: {
			format: 'bytes32',
		},
		value: {
			format: 'uint',
		},
		proof: {
			type: 'array',
			items: {
				format: 'bytes32',
			},
		},
	},
};

export const accountSchema = {
	type: 'object',
	properties: {
		balance: {
			format: 'uint',
		},
		codeHash: {
			format: 'bytes32',
		},
		nonce: {
			format: 'uint',
		},
		storageHash: {
			format: 'bytes32',
		},
		accountProof: {
			type: 'array',
			items: {
				format: 'bytes32',
			},
		},
		storageProof: {
			type: 'array',
			items: {
				...storageProofSchema,
			},
		},
	},
};
