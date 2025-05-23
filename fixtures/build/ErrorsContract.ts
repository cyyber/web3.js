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
export const ErrorsContractAbi = [
	{ inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
	{
		inputs: [{ internalType: 'string', name: '', type: 'string' }],
		name: 'CustomError',
		type: 'error',
	},
	{ inputs: [], name: 'Unauthorized', type: 'error' },
	{
		inputs: [],
		name: 'badRequire',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'unauthorize',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
] as const;
export const ErrorsContractBytecode =
	'0x60806040525f805f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555034801561004e575f80fd5b5061028d8061005c5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c8063593b0df4146100385780638ec6371414610042575b5f80fd5b61004061004c565b005b61004a6100f6565b005b600260011015610091576040517f8d6ea8be00000000000000000000000000000000000000000000000000000000815260040161008890610239565b60405180910390fd5b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc4790811502906040515f60405180830381858888f193505050501580156100f3573d5f803e3d5ffd5b50565b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461017a576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc4790811502906040515f60405180830381858888f193505050501580156101dc573d5f803e3d5ffd5b50565b5f82825260208201905092915050565b7f7265766572746564207573696e6720637573746f6d204572726f7200000000005f82015250565b5f610223601b836101df565b915061022e826101ef565b602082019050919050565b5f6020820190508181035f83015261025081610217565b905091905056fea264697066735822122057a99e26f20ecc70c84ffffdd7cd6e23f0c465dcee92f32c9db27c46ef39b3d96468797063430000020033';
