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

import * as qrl from '@theqrl/web3-qrl';
import {
	ValidChains,
	Hardfork,
	AccessListResult,
	Address,
	QRL_DATA_FORMAT,
} from '@theqrl/web3-types';
import { Web3ContractError } from '@theqrl/web3-errors';
import { Web3Context } from '@theqrl/web3-core';

import { Contract } from '../../src';
import { sampleStorageContractABI } from '../fixtures/storage';
import { GreeterAbi, GreeterBytecode } from '../shared_fixtures/build/Greeter';
import { AllGetPastEventsData, getLogsData, getPastEventsData } from '../fixtures/unitTestFixtures';
import { getSystemTestProvider, isHttp, itIf } from '../fixtures/system_test_utils';
import { zrc721Abi } from '../fixtures/zrc721';
import { ZRC20TokenAbi } from '../shared_fixtures/build/ZRC20Token';
import { processAsync } from '../shared_fixtures/utils';

jest.mock('@theqrl/web3-qrl');

describe('Contract', () => {
	describe('constructor', () => {
		it('should init with only the abi', () => {
			const contract = new Contract([]);

			expect(contract).toBeInstanceOf(Contract);
		});

		it('should throw if both options.data and options.input are provided', () => {
			expect(
				() =>
					new Contract([], {
						data: GreeterBytecode,
						input: GreeterBytecode,
					}),
			).toThrow(
				'You can\'t have "data" and "input" as properties of a contract at the same time, please use either "data" or "input" instead.',
			);
		});

		it('should init with abi and address', () => {
			const contract = new Contract([], 'Q00000000219ab540356cBB839Cbe05303d7705Fa');

			expect(contract).toBeInstanceOf(Contract);
		});

		it('should init with abi and options', () => {
			const contract = new Contract([], { gas: '123' });

			expect(contract).toBeInstanceOf(Contract);
		});

		it('method should have correct type by ABI', () => {
			const contractInstance = new Contract([
				{
					inputs: [
						{
							internalType: 'uint256',
							name: 'tokenId',
							type: 'uint256',
						},
					],
					name: 'tokenURI',
					outputs: [{ internalType: 'string', name: '', type: 'string' }],
					stateMutability: 'view',
					type: 'function',
				},
			] as const);

			const method = contractInstance.methods.tokenURI(123);

			expect(method).toBeDefined();
		});

		it('should init with abi, options and context', () => {
			const contract = new Contract(
				[],
				{ gas: '123' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			expect(contract).toBeInstanceOf(Contract);
		});

		it('should init with abi, address and options', () => {
			const contract = new Contract([], 'Q00000000219ab540356cBB839Cbe05303d7705Fa', {
				gas: '123',
			});

			expect(contract).toBeInstanceOf(Contract);
		});

		it('should init with abi, address, options and context', () => {
			const contract = new Contract(
				[],
				'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			expect(contract).toBeInstanceOf(Contract);
		});

		// TODO(youtrack/theqrl/web3.js/7)
		itIf(isHttp)('should set the provider, from options, upon instantiation', () => {
			const provider = getSystemTestProvider();
			const contract = new Contract([], '', {
				provider,
			});

			expect(contract.provider).toEqual({
				clientUrl: provider,
				httpProviderOptions: undefined,
			});
		});

		// TODO(youtrack/theqrl/web3.js/7)
		itIf(isHttp)('should set the provider, from context, upon instantiation', () => {
			const provider = getSystemTestProvider();
			const contract = new Contract(
				[],
				'',
				{},
				{
					provider,
				},
			);

			expect(contract.provider).toEqual({
				clientUrl: provider,
				httpProviderOptions: undefined,
			});
		});

		it('should pass the returnDataFormat to `_parseAndSetAddress` and `_parseAndSetJsonInterface`', () => {
			const contract = new Contract([], '', QRL_DATA_FORMAT);

			// @ts-expect-error run protected method
			const parseAndSetAddressSpy = jest.spyOn(contract, '_parseAndSetAddress');
			contract.options.address = 'Q6e599da0bff7a6598ac1224e4985430bf16458a4';

			expect(parseAndSetAddressSpy).toHaveBeenCalledWith(
				'Q6e599da0bff7a6598ac1224e4985430bf16458a4',
				QRL_DATA_FORMAT,
			);
			const parseAndSetJsonInterfaceSpy = jest.spyOn(
				contract,
				// @ts-expect-error run protected method
				'_parseAndSetJsonInterface',
			);
			contract.options.jsonInterface = [];
			expect(parseAndSetJsonInterfaceSpy).toHaveBeenCalledWith([], QRL_DATA_FORMAT);
		});

		it('should pass the returnDataFormat, as the constructor forth parameter, to `_parseAndSetAddress` and `_parseAndSetJsonInterface`', () => {
			const contract = new Contract([], '', {}, QRL_DATA_FORMAT);

			// @ts-expect-error run protected method
			const parseAndSetAddressSpy = jest.spyOn(contract, '_parseAndSetAddress');
			contract.options.address = 'Q6e599da0bff7a6598ac1224e4985430bf16458a4';

			expect(parseAndSetAddressSpy).toHaveBeenCalledWith(
				'Q6e599da0bff7a6598ac1224e4985430bf16458a4',
				QRL_DATA_FORMAT,
			);
			const parseAndSetJsonInterfaceSpy = jest.spyOn(
				contract,
				// @ts-expect-error run protected method
				'_parseAndSetJsonInterface',
			);
			contract.options.jsonInterface = [];
			expect(parseAndSetJsonInterfaceSpy).toHaveBeenCalledWith([], QRL_DATA_FORMAT);
		});

		it('should pass the returnDataFormat, as the constructor fifth parameter, to `_parseAndSetAddress` and `_parseAndSetJsonInterface`', () => {
			const contract = new Contract([], '', {}, {}, QRL_DATA_FORMAT);

			// @ts-expect-error run protected method
			const parseAndSetAddressSpy = jest.spyOn(contract, '_parseAndSetAddress');
			contract.options.address = 'Q6e599da0bff7a6598ac1224e4985430bf16458a4';

			expect(parseAndSetAddressSpy).toHaveBeenCalledWith(
				'Q6e599da0bff7a6598ac1224e4985430bf16458a4',
				QRL_DATA_FORMAT,
			);
			const parseAndSetJsonInterfaceSpy = jest.spyOn(
				contract,
				// @ts-expect-error run protected method
				'_parseAndSetJsonInterface',
			);
			contract.options.jsonInterface = [];
			expect(parseAndSetJsonInterfaceSpy).toHaveBeenCalledWith([], QRL_DATA_FORMAT);
		});
	});

	describe('Contract functions and defaults', () => {
		let sendOptions: Record<string, unknown>;
		const deployedAddr = 'Q20bc23D0598b12c34cBDEf1fae439Ba8744DB426';

		beforeEach(() => {
			sendOptions = {
				from: 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2',
				gas: '1000000',
			};
		});

		it('should deploy contract with input property', async () => {
			const input = `${GreeterBytecode}0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000`;
			const contract = new Contract(GreeterAbi);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const sendTransactionSpy = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, tx) => {
					expect(tx.to).toBeUndefined();
					expect(tx.gas).toStrictEqual(sendOptions.gas);
					expect(tx.maxFeePerGas).toBeUndefined();
					expect(tx.maxPriorityFeePerGas).toBeUndefined();
					expect(tx.from).toStrictEqual(sendOptions.from);
					expect(tx.input).toStrictEqual(input); // padded data

					const newContract = contract.clone();
					newContract.options.address = deployedAddr;

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(newContract) as any;
				});

			const deployedContract = await contract
				.deploy({
					input: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			expect(deployedContract).toBeDefined();
			expect(deployedContract.options.address).toStrictEqual(deployedAddr);
			sendTransactionSpy.mockClear();
		});

		it('should deploy contract with data property', async () => {
			const data = `${GreeterBytecode}0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000`;
			const contract = new Contract(GreeterAbi);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const sendTransactionSpy = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, tx) => {
					expect(tx.to).toBeUndefined();
					expect(tx.gas).toStrictEqual(sendOptions.gas);
					expect(tx.maxFeePerGas).toBeUndefined();
					expect(tx.maxPriorityFeePerGas).toBeUndefined();
					expect(tx.from).toStrictEqual(sendOptions.from);
					expect(tx.data).toStrictEqual(data); // padded data

					const newContract = contract.clone();
					newContract.options.address = deployedAddr;

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(newContract) as any;
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			expect(deployedContract).toBeDefined();
			expect(deployedContract.options.address).toStrictEqual(deployedAddr);
			sendTransactionSpy.mockClear();
		});

		// eslint-disable-next-line @typescript-eslint/require-await
		it('should not deploy contract with empty data', async () => {
			const contract = new Contract(GreeterAbi);

			expect(() => contract.deploy({ data: '' }).send(sendOptions)).toThrow(
				'contract creation without any data provided',
			);
		});

		// eslint-disable-next-line @typescript-eslint/require-await
		it('send method on deployed contract should work using input', async () => {
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi);
			sendOptions = {
				from: 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					expect(_tx.input).toBeDefined();
					if (
						_tx.input ===
						'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000'
					) {
						// eslint-disable-next-line
						expect(_tx.to).toStrictEqual(deployedAddr);
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
						return { status: '0x1', on: () => {} } as any;
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
					return Promise.resolve(Object.assign(newContract, { on: () => {} })) as any;
				});

			const deployedContract = await contract
				.deploy({
					input: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);
			const receipt = await deployedContract.methods.setGreeting(arg).send(sendOptions);
			expect(receipt.status).toBe('0x1');

			spyTx.mockClear();
		});

		it('send method on deployed contract should work using data', async () => {
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi);
			sendOptions = {
				from: 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2',
				gas: '1000000',
				data: '0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					expect(_tx.data).toBeDefined();
					if (
						_tx.data ===
						'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000'
					) {
						// eslint-disable-next-line
						expect(_tx.to).toStrictEqual(deployedAddr);
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
						return { status: '0x1', on: () => {} } as any;
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
					return Promise.resolve(Object.assign(newContract, { on: () => {} })) as any;
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);
			const receipt = await deployedContract.methods.setGreeting(arg).send(sendOptions);
			expect(receipt.status).toBe('0x1');

			spyTx.mockClear();
		});

		it('should send method on deployed contract should work with data using web3config', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'data',
					defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				},
			});
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi, web3Context);
			sendOptions = {
				from: 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					if (
						_tx.data ===
						'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000'
					) {
						// eslint-disable-next-line
						expect(_tx.to).toStrictEqual(deployedAddr);
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
						return { status: '0x1', on: () => {} } as any;
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
					return Promise.resolve(Object.assign(newContract, { on: () => {} })) as any;
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);
			const receipt = await deployedContract.methods.setGreeting(arg).send(sendOptions);
			expect(receipt.status).toBe('0x1');

			spyTx.mockClear();
		});

		it('send method on deployed contract should work with both input and data using web3config', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'both',
					defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				},
			});
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi, web3Context);
			sendOptions = {
				from: 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					if (
						_tx.data ===
						'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000'
					) {
						// eslint-disable-next-line
						expect(_tx.input).toStrictEqual(
							'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000',
						);
						// eslint-disable-next-line
						expect(_tx.to).toStrictEqual(deployedAddr);
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
						return { status: '0x1', on: () => {} } as any;
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
					return Promise.resolve(Object.assign(newContract, { on: () => {} })) as any;
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);
			const receipt = await deployedContract.methods.setGreeting(arg).send(sendOptions);
			expect(receipt.status).toBe('0x1');

			spyTx.mockClear();
		});

		it('should send method on deployed contract should work with input using web3config', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'input',
					defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				},
			});
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi, web3Context);
			sendOptions = {
				from: 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					if (
						_tx.input ===
						'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000'
					) {
						// eslint-disable-next-line
						expect(_tx.to).toStrictEqual(deployedAddr);
						// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
						return { status: '0x1', on: () => {} } as any;
					}

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-empty-function
					return Promise.resolve(Object.assign(newContract, { on: () => {} })) as any;
				});

			const deployedContract = await contract
				.deploy({
					input: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);
			const receipt = await deployedContract.methods.setGreeting(arg).send(sendOptions);
			expect(receipt.status).toBe('0x1');

			spyTx.mockClear();
		});

		it('call on deployed contract should decode result', async () => {
			const arg = 'Hello';
			const encodedArg =
				'0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000';
			const contract = new Contract(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyQRLCall = jest.spyOn(qrl, 'call').mockImplementation((_objInstance, _tx) => {
				expect(_tx.to).toStrictEqual(deployedAddr);
				expect(_tx.input).toBe('0xcfae3217');
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(encodedArg) as any; // contract class should decode encodedArg
			});
			const deployedContract = await contract
				.deploy({
					input: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);
			const res = await deployedContract.methods.greet().call();
			expect(res).toStrictEqual(arg);

			spyTx.mockClear();
			spyQRLCall.mockClear();
		});

		it('should clone pre deployed contract with address', () => {
			const contract = new Contract(
				sampleStorageContractABI,
				'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				{ gas: '0x97254' },
			);

			const clonnedContract = contract.clone();

			expect(JSON.stringify(contract)).toStrictEqual(JSON.stringify(clonnedContract));

			contract.options.jsonInterface = GreeterAbi;
		});

		it('should clone new contract', () => {
			const contract = new Contract(sampleStorageContractABI);

			const clonnedContract = contract.clone();
			expect(JSON.stringify(contract)).toStrictEqual(JSON.stringify(clonnedContract));
		});

		it('should be able to update the jsonInterface', () => {
			const contract = new Contract(sampleStorageContractABI);

			expect(contract.methods.retrieveNum).toBeDefined();
			expect(contract.methods.storeNum).toBeDefined();

			expect(contract.methods.greet).toBeUndefined();
			expect(contract.methods.increment).toBeUndefined();
			expect(contract.methods.setGreeting).toBeUndefined();

			contract.options.jsonInterface = GreeterAbi;

			expect(contract.methods.retrieveNum).toBeUndefined();
			expect(contract.methods.storeNum).toBeUndefined();

			expect(contract.methods.greet).toBeDefined();
			expect(contract.methods.increment).toBeDefined();
			expect(contract.methods.setGreeting).toBeDefined();
		});

		it('defaults set and get should work', () => {
			const contract = new Contract([], 'Q00000000219ab540356cBB839Cbe05303d7705Fa');

			const defaultAddr = 'Qd7E30ae310C1D1800F5B641Baa7af95b2e1FD98C';
			expect(contract.defaultAccount).toBeUndefined();
			contract.defaultAccount = defaultAddr;
			expect(contract.defaultAccount).toStrictEqual(defaultAddr);

			const defaultBlock = '0xC43A';
			expect(contract.defaultBlock).toBe('latest');
			contract.defaultBlock = defaultBlock;
			expect(contract.defaultBlock).toStrictEqual(defaultBlock);

			const defaultHardfork = 'constantinople';
			expect(contract.defaultHardfork).toBe('shanghai');
			contract.defaultHardfork = defaultHardfork;
			expect(contract.defaultHardfork).toStrictEqual(defaultHardfork);

			const baseChain = 'mainnet' as ValidChains;
			contract.defaultChain = baseChain;
			expect(contract.defaultChain).toBe(baseChain);

			const defaultCommonDifferentHardfork = {
				customChain: { name: 'testnet', networkId: '5678', chainId: '5634' },
				baseChain,
				hardfork: 'petersburg' as Hardfork,
			};
			expect(contract.defaultCommon).toBeUndefined();

			// Test that defaultcommon will error when defaulthardfork is not matching
			// Has to be wrapped in another function to check Error
			expect(() => {
				contract.defaultCommon = defaultCommonDifferentHardfork;
			}).toThrow(
				new Error(
					'Web3Config hardfork doesnt match in defaultHardfork constantinople and common.hardfork petersburg',
				),
			);

			expect(contract.defaultCommon).toBeUndefined();

			// Should error when defaultCommon has different chain than defaultChain
			const defaultCommonDifferentChain = {
				customChain: { name: 'testnet', networkId: '5678', chainId: '5634' },
				baseChain: 'sepolia' as ValidChains,
				hardfork: 'constantinople' as Hardfork,
			};
			expect(() => {
				contract.defaultCommon = defaultCommonDifferentChain;
			}).toThrow(
				new Error(
					'Web3Config chain doesnt match in defaultHardfork mainnet and common.hardfork sepolia',
				),
			);

			expect(contract.defaultCommon).toBeUndefined();

			const defaultCommon = {
				customChain: { name: 'testnet', networkId: '5678', chainId: '5634' },
				baseChain: 'mainnet' as ValidChains,
				hardfork: 'constantinople' as Hardfork,
			};
			contract.defaultCommon = defaultCommon;
			expect(contract.defaultCommon).toBe(defaultCommon);

			const transactionBlockTimeout = 130;
			expect(contract.transactionBlockTimeout).toBe(50);
			contract.transactionBlockTimeout = transactionBlockTimeout;
			expect(contract.transactionBlockTimeout).toStrictEqual(transactionBlockTimeout);

			const transactionConfirmationBlocks = 30;
			expect(contract.transactionConfirmationBlocks).toBe(24);
			contract.transactionConfirmationBlocks = transactionConfirmationBlocks;
			expect(contract.transactionConfirmationBlocks).toStrictEqual(
				transactionConfirmationBlocks,
			);

			const transactionPollingInterval = 1000;
			expect(contract.transactionPollingInterval).toBe(1000);
			contract.transactionPollingInterval = transactionPollingInterval;
			expect(contract.transactionPollingInterval).toStrictEqual(transactionPollingInterval);

			const transactionPollingTimeout = 800000;
			expect(contract.transactionPollingTimeout).toBe(750000);
			contract.transactionPollingTimeout = transactionPollingTimeout;
			expect(contract.transactionPollingTimeout).toStrictEqual(transactionPollingTimeout);

			const transactionReceiptPollingInterval = 2000;
			expect(contract.transactionReceiptPollingInterval).toBe(1000);
			contract.transactionReceiptPollingInterval = transactionReceiptPollingInterval;
			expect(contract.transactionReceiptPollingInterval).toStrictEqual(
				transactionReceiptPollingInterval,
			);

			const transactionConfirmationPollingInterval = 2501;
			expect(contract.transactionConfirmationPollingInterval).toBe(1000);
			contract.transactionConfirmationPollingInterval =
				transactionConfirmationPollingInterval;
			expect(contract.transactionConfirmationPollingInterval).toStrictEqual(
				transactionConfirmationPollingInterval,
			);

			const transactionSendTimeout = 730000;
			expect(contract.transactionSendTimeout).toBe(750000);
			contract.transactionSendTimeout = transactionSendTimeout;
			expect(contract.transactionSendTimeout).toStrictEqual(transactionSendTimeout);

			const blockHeaderTimeout = 12;
			expect(contract.blockHeaderTimeout).toBe(10);
			contract.blockHeaderTimeout = blockHeaderTimeout;
			expect(contract.blockHeaderTimeout).toStrictEqual(blockHeaderTimeout);

			expect(contract.handleRevert).toBe(false);
			contract.handleRevert = true;
			expect(contract.handleRevert).toBe(true);
		});

		it('should set and get correct address', () => {
			const addr = 'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701';
			const contract = new Contract(
				[],
				'',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			contract.options.address = addr;
			expect(contract.options.address).toStrictEqual(addr);
		});

		it('should set, at the constructor, and later get jsonInterface', () => {
			const contract = new Contract(
				sampleStorageContractABI,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			expect(contract.options.jsonInterface).toMatchObject(sampleStorageContractABI);
		});

		it('should set and get jsonInterface', () => {
			const contract = new Contract(
				sampleStorageContractABI,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			contract.options.jsonInterface = ZRC20TokenAbi;
			expect(contract.options.jsonInterface).toMatchObject(ZRC20TokenAbi);
		});

		it('should be able to call a payable method', async () => {
			const contract = new Contract(
				zrc721Abi,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q1230B93ffd14F2F022039675fA3fc3A46eE4C701');
					expect(_tx.input).toBe(
						'0x095ea7b300000000000000000000000000000000219ab540356cbb839cbe05303d7705fa0000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q00000000219ab540356cBB839Cbe05303d7705Fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with data as a contract init option', async () => {
			const contract = new Contract(
				zrc721Abi,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123', dataInputFill: 'data' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q1230B93ffd14F2F022039675fA3fc3A46eE4C701');
					expect(_tx.data).toBe(
						'0x095ea7b300000000000000000000000000000000219ab540356cbb839cbe05303d7705fa0000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q00000000219ab540356cBB839Cbe05303d7705Fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with input as a contract init option', async () => {
			const contract = new Contract(
				zrc721Abi,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123', dataInputFill: 'input' },
				{ config: { defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa' } },
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q1230B93ffd14F2F022039675fA3fc3A46eE4C701');
					expect(_tx.input).toBe(
						'0x095ea7b300000000000000000000000000000000219ab540356cbb839cbe05303d7705fa0000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q00000000219ab540356cBB839Cbe05303d7705Fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with data as a web3Context option', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'data',
					defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				},
			});
			const contract = new Contract(
				zrc721Abi,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123' },
				web3Context,
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q1230B93ffd14F2F022039675fA3fc3A46eE4C701');
					expect(_tx.data).toBe(
						'0x095ea7b300000000000000000000000000000000219ab540356cbb839cbe05303d7705fa0000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q00000000219ab540356cBB839Cbe05303d7705Fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with both data and input as a web3Context option', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'both',
					defaultAccount: 'Q00000000219ab540356cBB839Cbe05303d7705Fa',
				},
			});
			const contract = new Contract(
				zrc721Abi,
				'Q1230B93ffd14F2F022039675fA3fc3A46eE4C701',
				{ gas: '123' },
				web3Context,
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q1230B93ffd14F2F022039675fA3fc3A46eE4C701');
					expect(_tx.data).toBe(
						'0x095ea7b300000000000000000000000000000000219ab540356cbb839cbe05303d7705fa0000000000000000000000000000000000000000000000000000000000000001',
					);
					expect(_tx.input).toBe(
						'0x095ea7b300000000000000000000000000000000219ab540356cbb839cbe05303d7705fa0000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q00000000219ab540356cBB839Cbe05303d7705Fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('getPastEvents with filter should work', async () => {
			const contract = new Contract<typeof GreeterAbi>(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyGetLogs = jest
				.spyOn(qrl, 'getLogs')
				.mockImplementation((_objInstance, _params) => {
					expect(_params.address).toBe(`Z${deployedAddr.slice(1).toLocaleLowerCase()}`);
					expect(_params.fromBlock).toStrictEqual(getLogsData.request.fromBlock);
					expect(_params.toBlock).toStrictEqual(getLogsData.request.toBlock);
					expect(_params.topics).toStrictEqual(getLogsData.request.topics);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(getLogsData.response) as any;
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const fromBlock = 'earliest';
			const toBlock = 'latest';
			const pastEvent = await deployedContract.getPastEvents(getPastEventsData.event as any, {
				fromBlock,
				toBlock,
			});

			expect(pastEvent).toStrictEqual(getPastEventsData.response);
			spyTx.mockClear();
			spyGetLogs.mockClear();
		});

		it('getPastEvents with filter by topics should work', async () => {
			const contract = new Contract<typeof GreeterAbi>(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyGetLogs = jest
				.spyOn(qrl, 'getLogs')
				.mockImplementation((_objInstance, _params) => {
					expect(_params.address).toBe(`Z${deployedAddr.slice(1).toLocaleLowerCase()}`);
					expect(_params.fromBlock).toStrictEqual(getLogsData.request.fromBlock);
					expect(_params.toBlock).toStrictEqual(getLogsData.request.toBlock);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve([getLogsData.response[0]]) as any;
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const fromBlock = 'earliest';
			const toBlock = 'latest';
			const pastEvent = await deployedContract.getPastEvents(getPastEventsData.event as any, {
				fromBlock,
				toBlock,
				topics: ['0x7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e'],
			});

			expect(pastEvent).toStrictEqual(getPastEventsData.response);
			spyTx.mockClear();
			spyGetLogs.mockClear();
		});

		it('getPastEvents for all events should work', async () => {
			const contract = new Contract<typeof GreeterAbi>(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyGetLogs = jest
				.spyOn(qrl, 'getLogs')
				.mockImplementation((_objInstance, _params) => {
					expect(_params.address).toBe(`Z${deployedAddr.slice(1).toLocaleLowerCase()}`);
					expect(_params.fromBlock).toBeUndefined();
					expect(_params.toBlock).toBeUndefined();
					expect(_params.topics).toBeUndefined();

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(AllGetPastEventsData.getLogsData) as any; // AllGetPastEventsData.getLogsData data test is for: assume two transactions sent to contract with contractInstance.methods.setGreeting("Hello") and contractInstance.methods.setGreeting("Another Greeting")
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const pastEvent = await deployedContract.getPastEvents('allEvents');

			expect(pastEvent).toStrictEqual(AllGetPastEventsData.response);
			spyTx.mockClear();
			spyGetLogs.mockClear();
		});

		it('getPastEvents for all events with filter should work', async () => {
			const contract = new Contract<typeof GreeterAbi>(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyGetLogs = jest
				.spyOn(qrl, 'getLogs')
				.mockImplementation((_objInstance, _params) => {
					expect(_params.address).toBe(`Z${deployedAddr.slice(1).toLocaleLowerCase()}`);
					expect(_params.fromBlock).toBeUndefined();
					expect(_params.toBlock).toBeUndefined();
					expect(_params.topics).toBeUndefined();

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(AllGetPastEventsData.getLogsData) as any; // AllGetPastEventsData.getLogsData data test is for: assume two transactions sent to contract with contractInstance.methods.setGreeting("Hello") and contractInstance.methods.setGreeting("Another Greeting")
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const pastEvent = await deployedContract.getPastEvents('allEvents', {
				filter: {
					greeting: 'Another Greeting',
				},
			});

			expect(pastEvent).toHaveLength(1);
			expect(pastEvent[0]).toStrictEqual(AllGetPastEventsData.response[1]);

			const pastEventWithoutEventName = await deployedContract.getPastEvents({
				filter: {
					greeting: 'Another Greeting',
				},
			});

			expect(pastEventWithoutEventName).toHaveLength(1);
			expect(pastEventWithoutEventName[0]).toStrictEqual(AllGetPastEventsData.response[1]);

			const pastEventFilterArray = await deployedContract.getPastEvents({
				filter: {
					greeting: ['Another Greeting'],
				},
			});

			expect(pastEventFilterArray).toHaveLength(1);
			expect(pastEventFilterArray[0]).toStrictEqual(AllGetPastEventsData.response[1]);

			const pastEventFilterWithIncorrectParam = await deployedContract.getPastEvents({
				filter: {
					incorrectParam: 'test',
				},
			});
			expect(pastEventFilterWithIncorrectParam).toHaveLength(0);

			spyTx.mockClear();
			spyGetLogs.mockClear();
		});

		it('getPastEvents for all events with filter by topics should work', async () => {
			const contract = new Contract<typeof GreeterAbi>(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyGetLogs = jest
				.spyOn(qrl, 'getLogs')
				.mockImplementation((_objInstance, _params) => {
					expect(_params.address).toBe(`Z${deployedAddr.slice(1).toLocaleLowerCase()}`);
					expect(_params.fromBlock).toBeUndefined();
					expect(_params.toBlock).toBeUndefined();

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve([AllGetPastEventsData.getLogsData[1]]) as any; // AllGetPastEventsData.getLogsData data test is for: assume two transactions sent to contract with contractInstance.methods.setGreeting("Hello") and contractInstance.methods.setGreeting("Another Greeting")
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const pastEvent = await deployedContract.getPastEvents({
				topics: ['0x7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e'],
			});
			expect(pastEvent).toHaveLength(1);
			expect(pastEvent[0]).toStrictEqual(AllGetPastEventsData.response[1]);

			spyTx.mockClear();
			spyGetLogs.mockClear();
		});

		it('allEvents() should throw error with inner error', async () => {
			const contract = new Contract<typeof GreeterAbi>(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyGetLogs = jest
				.spyOn(qrl, 'getLogs')
				.mockImplementation((_objInstance, _params) => {
					throw new Error('Inner error');
				});

			const deployedContract = await contract
				.deploy({
					data: GreeterBytecode,
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			await expect(
				processAsync(async (resolve, reject) => {
					const event = deployedContract.events.allEvents({ fromBlock: 'earliest' });

					event.on('error', reject);
					event.on('data', resolve);
				}),
			).rejects.toThrow(
				expect.objectContaining({
					innerError: expect.any(Error),
				}),
			);

			spyTx.mockClear();
			spyGetLogs.mockClear();
		});

		it('encodeABI should work for the deploy function using data', () => {
			const contract = new Contract(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const deploy = contract.deploy({
				data: GreeterBytecode,
				arguments: ['My Greeting'],
			});

			const result = deploy.encodeABI();
			expect(result).toBe(
				'0x608060405234801562000010575f80fd5b5060405162000e6238038062000e628339818101604052810190620000369190620001da565b806001908162000047919062000460565b505f80819055505062000544565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b620000b6826200006e565b810181811067ffffffffffffffff82111715620000d857620000d76200007e565b5b80604052505050565b5f620000ec62000055565b9050620000fa8282620000ab565b919050565b5f67ffffffffffffffff8211156200011c576200011b6200007e565b5b62000127826200006e565b9050602081019050919050565b5f5b838110156200015357808201518184015260208101905062000136565b5f8484015250505050565b5f620001746200016e84620000ff565b620000e1565b9050828152602081018484840111156200019357620001926200006a565b5b620001a084828562000134565b509392505050565b5f82601f830112620001bf57620001be62000066565b5b8151620001d18482602086016200015e565b91505092915050565b5f60208284031215620001f257620001f16200005e565b5b5f82015167ffffffffffffffff81111562000212576200021162000062565b5b6200022084828501620001a8565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200027857607f821691505b6020821081036200028e576200028d62000233565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620002f27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620002b5565b620002fe8683620002b5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f62000348620003426200033c8462000316565b6200031f565b62000316565b9050919050565b5f819050919050565b620003638362000328565b6200037b62000372826200034f565b848454620002c1565b825550505050565b5f90565b6200039162000383565b6200039e81848462000358565b505050565b5b81811015620003c557620003b95f8262000387565b600181019050620003a4565b5050565b601f8211156200041457620003de8162000294565b620003e984620002a6565b81016020851015620003f9578190505b620004116200040885620002a6565b830182620003a3565b50505b505050565b5f82821c905092915050565b5f620004365f198460080262000419565b1980831691505092915050565b5f62000450838362000425565b9150826002028217905092915050565b6200046b8262000229565b67ffffffffffffffff8111156200048757620004866200007e565b5b62000493825462000260565b620004a0828285620003c9565b5f60209050601f831160018114620004d6575f8415620004c1578287015190505b620004cd858262000443565b8655506200053c565b601f198416620004e68662000294565b5f5b828110156200050f57848901518255600182019150602085019450602081019050620004e8565b868310156200052f57848901516200052b601f89168262000425565b8355505b6001600288020188555050505b505050505050565b61091080620005525f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae321714610074578063d09de08a14610092575b5f80fd5b61005d600480360381019061005891906103a9565b61009c565b60405161006b929190610484565b60405180910390f35b61007c6101b7565b60405161008991906104b2565b60405180910390f35b61009a610247565b005b5f60607f0d363f2fba46ab11b6db8da0125b0d5484787c44e265b48810735998bab12b756001846040516100d19291906105c2565b60405180910390a182600190816100e8919061078b565b507f7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e6001604051610119919061085a565b60405180910390a1600180808054610130906104ff565b80601f016020809104026020016040519081016040528092919081815260200182805461015c906104ff565b80156101a75780601f1061017e576101008083540402835291602001916101a7565b820191905f5260205f20905b81548152906001019060200180831161018a57829003601f168201915b5050505050905091509150915091565b6060600180546101c6906104ff565b80601f01602080910402602001604051908101604052809291908181526020018280546101f2906104ff565b801561023d5780601f106102145761010080835404028352916020019161023d565b820191905f5260205f20905b81548152906001019060200180831161022057829003601f168201915b5050505050905090565b60015f5461025591906108a7565b5f81905550565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102bb82610275565b810181811067ffffffffffffffff821117156102da576102d9610285565b5b80604052505050565b5f6102ec61025c565b90506102f882826102b2565b919050565b5f67ffffffffffffffff82111561031757610316610285565b5b61032082610275565b9050602081019050919050565b828183375f83830152505050565b5f61034d610348846102fd565b6102e3565b90508281526020810184848401111561036957610368610271565b5b61037484828561032d565b509392505050565b5f82601f8301126103905761038f61026d565b5b81356103a084826020860161033b565b91505092915050565b5f602082840312156103be576103bd610265565b5b5f82013567ffffffffffffffff8111156103db576103da610269565b5b6103e78482850161037c565b91505092915050565b5f8115159050919050565b610404816103f0565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610441578082015181840152602081019050610426565b5f8484015250505050565b5f6104568261040a565b6104608185610414565b9350610470818560208601610424565b61047981610275565b840191505092915050565b5f6040820190506104975f8301856103fb565b81810360208301526104a9818461044c565b90509392505050565b5f6020820190508181035f8301526104ca818461044c565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051657607f821691505b602082108103610529576105286104d2565b5b50919050565b5f819050815f5260205f209050919050565b5f815461054d816104ff565b6105578186610414565b9450600182165f81146105715760018114610587576105b9565b60ff1983168652811515602002860193506105b9565b6105908561052f565b5f5b838110156105b157815481890152600182019150602081019050610592565b808801955050505b50505092915050565b5f6040820190508181035f8301526105da8185610541565b905081810360208301526105ee818461044c565b90509392505050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106417fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610606565b61064b8683610606565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61068f61068a61068584610663565b61066c565b610663565b9050919050565b5f819050919050565b6106a883610675565b6106bc6106b482610696565b848454610612565b825550505050565b5f90565b6106d06106c4565b6106db81848461069f565b505050565b5b818110156106fe576106f35f826106c8565b6001810190506106e1565b5050565b601f821115610743576107148161052f565b61071d846105f7565b8101602085101561072c578190505b610740610738856105f7565b8301826106e0565b50505b505050565b5f82821c905092915050565b5f6107635f1984600802610748565b1980831691505092915050565b5f61077b8383610754565b9150826002028217905092915050565b6107948261040a565b67ffffffffffffffff8111156107ad576107ac610285565b5b6107b782546104ff565b6107c2828285610702565b5f60209050601f8311600181146107f3575f84156107e1578287015190505b6107eb8582610770565b865550610852565b601f1984166108018661052f565b5f5b8281101561082857848901518255600182019150602085019450602081019050610803565b868310156108455784890151610841601f891682610754565b8355505b6001600288020188555050505b505050505050565b5f6020820190508181035f8301526108728184610541565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6108b182610663565b91506108bc83610663565b92508282019050808211156108d4576108d361087a565b5b9291505056fea264697066735822122039a530133d747adb5dc07fe92ab69bfc5e9af0e823a9563f32a3974379e87da564687970634300000200330000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000',
			);

			spyTx.mockClear();
		});

		it('estimateGas should work for the deploy function using input', async () => {
			const contract = new Contract(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyEstimateGas = jest
				.spyOn(qrl, 'estimateGas')
				.mockImplementationOnce((_objInstance, _tx, _block, returnFormat) => {
					expect(_block).toBe('latest');
					expect(_tx.to).toBeUndefined();
					expect(_tx.from).toStrictEqual(sendOptions.from);
					expect(_tx.input).toBe(
						'0x608060405234801562000010575f80fd5b5060405162000e6238038062000e628339818101604052810190620000369190620001da565b806001908162000047919062000460565b505f80819055505062000544565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b620000b6826200006e565b810181811067ffffffffffffffff82111715620000d857620000d76200007e565b5b80604052505050565b5f620000ec62000055565b9050620000fa8282620000ab565b919050565b5f67ffffffffffffffff8211156200011c576200011b6200007e565b5b62000127826200006e565b9050602081019050919050565b5f5b838110156200015357808201518184015260208101905062000136565b5f8484015250505050565b5f620001746200016e84620000ff565b620000e1565b9050828152602081018484840111156200019357620001926200006a565b5b620001a084828562000134565b509392505050565b5f82601f830112620001bf57620001be62000066565b5b8151620001d18482602086016200015e565b91505092915050565b5f60208284031215620001f257620001f16200005e565b5b5f82015167ffffffffffffffff81111562000212576200021162000062565b5b6200022084828501620001a8565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200027857607f821691505b6020821081036200028e576200028d62000233565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620002f27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620002b5565b620002fe8683620002b5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f62000348620003426200033c8462000316565b6200031f565b62000316565b9050919050565b5f819050919050565b620003638362000328565b6200037b62000372826200034f565b848454620002c1565b825550505050565b5f90565b6200039162000383565b6200039e81848462000358565b505050565b5b81811015620003c557620003b95f8262000387565b600181019050620003a4565b5050565b601f8211156200041457620003de8162000294565b620003e984620002a6565b81016020851015620003f9578190505b620004116200040885620002a6565b830182620003a3565b50505b505050565b5f82821c905092915050565b5f620004365f198460080262000419565b1980831691505092915050565b5f62000450838362000425565b9150826002028217905092915050565b6200046b8262000229565b67ffffffffffffffff8111156200048757620004866200007e565b5b62000493825462000260565b620004a0828285620003c9565b5f60209050601f831160018114620004d6575f8415620004c1578287015190505b620004cd858262000443565b8655506200053c565b601f198416620004e68662000294565b5f5b828110156200050f57848901518255600182019150602085019450602081019050620004e8565b868310156200052f57848901516200052b601f89168262000425565b8355505b6001600288020188555050505b505050505050565b61091080620005525f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae321714610074578063d09de08a14610092575b5f80fd5b61005d600480360381019061005891906103a9565b61009c565b60405161006b929190610484565b60405180910390f35b61007c6101b7565b60405161008991906104b2565b60405180910390f35b61009a610247565b005b5f60607f0d363f2fba46ab11b6db8da0125b0d5484787c44e265b48810735998bab12b756001846040516100d19291906105c2565b60405180910390a182600190816100e8919061078b565b507f7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e6001604051610119919061085a565b60405180910390a1600180808054610130906104ff565b80601f016020809104026020016040519081016040528092919081815260200182805461015c906104ff565b80156101a75780601f1061017e576101008083540402835291602001916101a7565b820191905f5260205f20905b81548152906001019060200180831161018a57829003601f168201915b5050505050905091509150915091565b6060600180546101c6906104ff565b80601f01602080910402602001604051908101604052809291908181526020018280546101f2906104ff565b801561023d5780601f106102145761010080835404028352916020019161023d565b820191905f5260205f20905b81548152906001019060200180831161022057829003601f168201915b5050505050905090565b60015f5461025591906108a7565b5f81905550565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102bb82610275565b810181811067ffffffffffffffff821117156102da576102d9610285565b5b80604052505050565b5f6102ec61025c565b90506102f882826102b2565b919050565b5f67ffffffffffffffff82111561031757610316610285565b5b61032082610275565b9050602081019050919050565b828183375f83830152505050565b5f61034d610348846102fd565b6102e3565b90508281526020810184848401111561036957610368610271565b5b61037484828561032d565b509392505050565b5f82601f8301126103905761038f61026d565b5b81356103a084826020860161033b565b91505092915050565b5f602082840312156103be576103bd610265565b5b5f82013567ffffffffffffffff8111156103db576103da610269565b5b6103e78482850161037c565b91505092915050565b5f8115159050919050565b610404816103f0565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610441578082015181840152602081019050610426565b5f8484015250505050565b5f6104568261040a565b6104608185610414565b9350610470818560208601610424565b61047981610275565b840191505092915050565b5f6040820190506104975f8301856103fb565b81810360208301526104a9818461044c565b90509392505050565b5f6020820190508181035f8301526104ca818461044c565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051657607f821691505b602082108103610529576105286104d2565b5b50919050565b5f819050815f5260205f209050919050565b5f815461054d816104ff565b6105578186610414565b9450600182165f81146105715760018114610587576105b9565b60ff1983168652811515602002860193506105b9565b6105908561052f565b5f5b838110156105b157815481890152600182019150602081019050610592565b808801955050505b50505092915050565b5f6040820190508181035f8301526105da8185610541565b905081810360208301526105ee818461044c565b90509392505050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106417fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610606565b61064b8683610606565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61068f61068a61068584610663565b61066c565b610663565b9050919050565b5f819050919050565b6106a883610675565b6106bc6106b482610696565b848454610612565b825550505050565b5f90565b6106d06106c4565b6106db81848461069f565b505050565b5b818110156106fe576106f35f826106c8565b6001810190506106e1565b5050565b601f821115610743576107148161052f565b61071d846105f7565b8101602085101561072c578190505b610740610738856105f7565b8301826106e0565b50505b505050565b5f82821c905092915050565b5f6107635f1984600802610748565b1980831691505092915050565b5f61077b8383610754565b9150826002028217905092915050565b6107948261040a565b67ffffffffffffffff8111156107ad576107ac610285565b5b6107b782546104ff565b6107c2828285610702565b5f60209050601f8311600181146107f3575f84156107e1578287015190505b6107eb8582610770565b865550610852565b601f1984166108018661052f565b5f5b8281101561082857848901518255600182019150602085019450602081019050610803565b868310156108455784890151610841601f891682610754565b8355505b6001600288020188555050505b505050505050565b5f6020820190508181035f8301526108728184610541565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6108b182610663565b91506108bc83610663565b92508282019050808211156108d4576108d361087a565b5b9291505056fea264697066735822122039a530133d747adb5dc07fe92ab69bfc5e9af0e823a9563f32a3974379e87da564687970634300000200330000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000',
					);
					expect(returnFormat).toBe(QRL_DATA_FORMAT);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(BigInt(36916)) as any;
				});

			const deploy = contract.deploy({
				input: GreeterBytecode,
				arguments: ['My Greeting'],
			});

			const result = await deploy.estimateGas(sendOptions, QRL_DATA_FORMAT);
			expect(result).toStrictEqual(BigInt(36916));

			spyTx.mockClear();
			spyEstimateGas.mockClear();
		});

		it('estimateGas should work for the deploy function using data', async () => {
			const contract = new Contract(GreeterAbi);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyEstimateGas = jest
				.spyOn(qrl, 'estimateGas')
				.mockImplementationOnce((_objInstance, _tx, _block, returnFormat) => {
					expect(_block).toBe('latest');
					expect(_tx.to).toBeUndefined();
					expect(_tx.from).toStrictEqual(sendOptions.from);
					expect(_tx.data).toBe(
						'0x608060405234801562000010575f80fd5b5060405162000e6238038062000e628339818101604052810190620000369190620001da565b806001908162000047919062000460565b505f80819055505062000544565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b620000b6826200006e565b810181811067ffffffffffffffff82111715620000d857620000d76200007e565b5b80604052505050565b5f620000ec62000055565b9050620000fa8282620000ab565b919050565b5f67ffffffffffffffff8211156200011c576200011b6200007e565b5b62000127826200006e565b9050602081019050919050565b5f5b838110156200015357808201518184015260208101905062000136565b5f8484015250505050565b5f620001746200016e84620000ff565b620000e1565b9050828152602081018484840111156200019357620001926200006a565b5b620001a084828562000134565b509392505050565b5f82601f830112620001bf57620001be62000066565b5b8151620001d18482602086016200015e565b91505092915050565b5f60208284031215620001f257620001f16200005e565b5b5f82015167ffffffffffffffff81111562000212576200021162000062565b5b6200022084828501620001a8565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200027857607f821691505b6020821081036200028e576200028d62000233565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620002f27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620002b5565b620002fe8683620002b5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f62000348620003426200033c8462000316565b6200031f565b62000316565b9050919050565b5f819050919050565b620003638362000328565b6200037b62000372826200034f565b848454620002c1565b825550505050565b5f90565b6200039162000383565b6200039e81848462000358565b505050565b5b81811015620003c557620003b95f8262000387565b600181019050620003a4565b5050565b601f8211156200041457620003de8162000294565b620003e984620002a6565b81016020851015620003f9578190505b620004116200040885620002a6565b830182620003a3565b50505b505050565b5f82821c905092915050565b5f620004365f198460080262000419565b1980831691505092915050565b5f62000450838362000425565b9150826002028217905092915050565b6200046b8262000229565b67ffffffffffffffff8111156200048757620004866200007e565b5b62000493825462000260565b620004a0828285620003c9565b5f60209050601f831160018114620004d6575f8415620004c1578287015190505b620004cd858262000443565b8655506200053c565b601f198416620004e68662000294565b5f5b828110156200050f57848901518255600182019150602085019450602081019050620004e8565b868310156200052f57848901516200052b601f89168262000425565b8355505b6001600288020188555050505b505050505050565b61091080620005525f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae321714610074578063d09de08a14610092575b5f80fd5b61005d600480360381019061005891906103a9565b61009c565b60405161006b929190610484565b60405180910390f35b61007c6101b7565b60405161008991906104b2565b60405180910390f35b61009a610247565b005b5f60607f0d363f2fba46ab11b6db8da0125b0d5484787c44e265b48810735998bab12b756001846040516100d19291906105c2565b60405180910390a182600190816100e8919061078b565b507f7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e6001604051610119919061085a565b60405180910390a1600180808054610130906104ff565b80601f016020809104026020016040519081016040528092919081815260200182805461015c906104ff565b80156101a75780601f1061017e576101008083540402835291602001916101a7565b820191905f5260205f20905b81548152906001019060200180831161018a57829003601f168201915b5050505050905091509150915091565b6060600180546101c6906104ff565b80601f01602080910402602001604051908101604052809291908181526020018280546101f2906104ff565b801561023d5780601f106102145761010080835404028352916020019161023d565b820191905f5260205f20905b81548152906001019060200180831161022057829003601f168201915b5050505050905090565b60015f5461025591906108a7565b5f81905550565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102bb82610275565b810181811067ffffffffffffffff821117156102da576102d9610285565b5b80604052505050565b5f6102ec61025c565b90506102f882826102b2565b919050565b5f67ffffffffffffffff82111561031757610316610285565b5b61032082610275565b9050602081019050919050565b828183375f83830152505050565b5f61034d610348846102fd565b6102e3565b90508281526020810184848401111561036957610368610271565b5b61037484828561032d565b509392505050565b5f82601f8301126103905761038f61026d565b5b81356103a084826020860161033b565b91505092915050565b5f602082840312156103be576103bd610265565b5b5f82013567ffffffffffffffff8111156103db576103da610269565b5b6103e78482850161037c565b91505092915050565b5f8115159050919050565b610404816103f0565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610441578082015181840152602081019050610426565b5f8484015250505050565b5f6104568261040a565b6104608185610414565b9350610470818560208601610424565b61047981610275565b840191505092915050565b5f6040820190506104975f8301856103fb565b81810360208301526104a9818461044c565b90509392505050565b5f6020820190508181035f8301526104ca818461044c565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051657607f821691505b602082108103610529576105286104d2565b5b50919050565b5f819050815f5260205f209050919050565b5f815461054d816104ff565b6105578186610414565b9450600182165f81146105715760018114610587576105b9565b60ff1983168652811515602002860193506105b9565b6105908561052f565b5f5b838110156105b157815481890152600182019150602081019050610592565b808801955050505b50505092915050565b5f6040820190508181035f8301526105da8185610541565b905081810360208301526105ee818461044c565b90509392505050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106417fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610606565b61064b8683610606565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61068f61068a61068584610663565b61066c565b610663565b9050919050565b5f819050919050565b6106a883610675565b6106bc6106b482610696565b848454610612565b825550505050565b5f90565b6106d06106c4565b6106db81848461069f565b505050565b5b818110156106fe576106f35f826106c8565b6001810190506106e1565b5050565b601f821115610743576107148161052f565b61071d846105f7565b8101602085101561072c578190505b610740610738856105f7565b8301826106e0565b50505b505050565b5f82821c905092915050565b5f6107635f1984600802610748565b1980831691505092915050565b5f61077b8383610754565b9150826002028217905092915050565b6107948261040a565b67ffffffffffffffff8111156107ad576107ac610285565b5b6107b782546104ff565b6107c2828285610702565b5f60209050601f8311600181146107f3575f84156107e1578287015190505b6107eb8582610770565b865550610852565b601f1984166108018661052f565b5f5b8281101561082857848901518255600182019150602085019450602081019050610803565b868310156108455784890151610841601f891682610754565b8355505b6001600288020188555050505b505050505050565b5f6020820190508181035f8301526108728184610541565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6108b182610663565b91506108bc83610663565b92508282019050808211156108d4576108d361087a565b5b9291505056fea264697066735822122039a530133d747adb5dc07fe92ab69bfc5e9af0e823a9563f32a3974379e87da564687970634300000200330000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000',
					);
					expect(returnFormat).toBe(QRL_DATA_FORMAT);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(BigInt(36916)) as any;
				});

			const deploy = contract.deploy({
				data: GreeterBytecode,
				arguments: ['My Greeting'],
			});

			const result = await deploy.estimateGas(sendOptions, QRL_DATA_FORMAT);
			expect(result).toStrictEqual(BigInt(36916));

			spyTx.mockClear();
			spyEstimateGas.mockClear();
		});

		it('estimateGas should work for the deploy function using both data and input web3config', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: { contractDataInputFill: 'both' },
			});

			const contract = new Contract(GreeterAbi, web3Context);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyEstimateGas = jest
				.spyOn(qrl, 'estimateGas')
				.mockImplementationOnce((_objInstance, _tx, _block, returnFormat) => {
					expect(_block).toBe('latest');
					expect(_tx.to).toBeUndefined();
					expect(_tx.from).toStrictEqual(sendOptions.from);
					expect(_tx.data).toBe(
						'0x608060405234801562000010575f80fd5b5060405162000e6238038062000e628339818101604052810190620000369190620001da565b806001908162000047919062000460565b505f80819055505062000544565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b620000b6826200006e565b810181811067ffffffffffffffff82111715620000d857620000d76200007e565b5b80604052505050565b5f620000ec62000055565b9050620000fa8282620000ab565b919050565b5f67ffffffffffffffff8211156200011c576200011b6200007e565b5b62000127826200006e565b9050602081019050919050565b5f5b838110156200015357808201518184015260208101905062000136565b5f8484015250505050565b5f620001746200016e84620000ff565b620000e1565b9050828152602081018484840111156200019357620001926200006a565b5b620001a084828562000134565b509392505050565b5f82601f830112620001bf57620001be62000066565b5b8151620001d18482602086016200015e565b91505092915050565b5f60208284031215620001f257620001f16200005e565b5b5f82015167ffffffffffffffff81111562000212576200021162000062565b5b6200022084828501620001a8565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200027857607f821691505b6020821081036200028e576200028d62000233565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620002f27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620002b5565b620002fe8683620002b5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f62000348620003426200033c8462000316565b6200031f565b62000316565b9050919050565b5f819050919050565b620003638362000328565b6200037b62000372826200034f565b848454620002c1565b825550505050565b5f90565b6200039162000383565b6200039e81848462000358565b505050565b5b81811015620003c557620003b95f8262000387565b600181019050620003a4565b5050565b601f8211156200041457620003de8162000294565b620003e984620002a6565b81016020851015620003f9578190505b620004116200040885620002a6565b830182620003a3565b50505b505050565b5f82821c905092915050565b5f620004365f198460080262000419565b1980831691505092915050565b5f62000450838362000425565b9150826002028217905092915050565b6200046b8262000229565b67ffffffffffffffff8111156200048757620004866200007e565b5b62000493825462000260565b620004a0828285620003c9565b5f60209050601f831160018114620004d6575f8415620004c1578287015190505b620004cd858262000443565b8655506200053c565b601f198416620004e68662000294565b5f5b828110156200050f57848901518255600182019150602085019450602081019050620004e8565b868310156200052f57848901516200052b601f89168262000425565b8355505b6001600288020188555050505b505050505050565b61091080620005525f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae321714610074578063d09de08a14610092575b5f80fd5b61005d600480360381019061005891906103a9565b61009c565b60405161006b929190610484565b60405180910390f35b61007c6101b7565b60405161008991906104b2565b60405180910390f35b61009a610247565b005b5f60607f0d363f2fba46ab11b6db8da0125b0d5484787c44e265b48810735998bab12b756001846040516100d19291906105c2565b60405180910390a182600190816100e8919061078b565b507f7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e6001604051610119919061085a565b60405180910390a1600180808054610130906104ff565b80601f016020809104026020016040519081016040528092919081815260200182805461015c906104ff565b80156101a75780601f1061017e576101008083540402835291602001916101a7565b820191905f5260205f20905b81548152906001019060200180831161018a57829003601f168201915b5050505050905091509150915091565b6060600180546101c6906104ff565b80601f01602080910402602001604051908101604052809291908181526020018280546101f2906104ff565b801561023d5780601f106102145761010080835404028352916020019161023d565b820191905f5260205f20905b81548152906001019060200180831161022057829003601f168201915b5050505050905090565b60015f5461025591906108a7565b5f81905550565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102bb82610275565b810181811067ffffffffffffffff821117156102da576102d9610285565b5b80604052505050565b5f6102ec61025c565b90506102f882826102b2565b919050565b5f67ffffffffffffffff82111561031757610316610285565b5b61032082610275565b9050602081019050919050565b828183375f83830152505050565b5f61034d610348846102fd565b6102e3565b90508281526020810184848401111561036957610368610271565b5b61037484828561032d565b509392505050565b5f82601f8301126103905761038f61026d565b5b81356103a084826020860161033b565b91505092915050565b5f602082840312156103be576103bd610265565b5b5f82013567ffffffffffffffff8111156103db576103da610269565b5b6103e78482850161037c565b91505092915050565b5f8115159050919050565b610404816103f0565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610441578082015181840152602081019050610426565b5f8484015250505050565b5f6104568261040a565b6104608185610414565b9350610470818560208601610424565b61047981610275565b840191505092915050565b5f6040820190506104975f8301856103fb565b81810360208301526104a9818461044c565b90509392505050565b5f6020820190508181035f8301526104ca818461044c565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051657607f821691505b602082108103610529576105286104d2565b5b50919050565b5f819050815f5260205f209050919050565b5f815461054d816104ff565b6105578186610414565b9450600182165f81146105715760018114610587576105b9565b60ff1983168652811515602002860193506105b9565b6105908561052f565b5f5b838110156105b157815481890152600182019150602081019050610592565b808801955050505b50505092915050565b5f6040820190508181035f8301526105da8185610541565b905081810360208301526105ee818461044c565b90509392505050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106417fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610606565b61064b8683610606565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61068f61068a61068584610663565b61066c565b610663565b9050919050565b5f819050919050565b6106a883610675565b6106bc6106b482610696565b848454610612565b825550505050565b5f90565b6106d06106c4565b6106db81848461069f565b505050565b5b818110156106fe576106f35f826106c8565b6001810190506106e1565b5050565b601f821115610743576107148161052f565b61071d846105f7565b8101602085101561072c578190505b610740610738856105f7565b8301826106e0565b50505b505050565b5f82821c905092915050565b5f6107635f1984600802610748565b1980831691505092915050565b5f61077b8383610754565b9150826002028217905092915050565b6107948261040a565b67ffffffffffffffff8111156107ad576107ac610285565b5b6107b782546104ff565b6107c2828285610702565b5f60209050601f8311600181146107f3575f84156107e1578287015190505b6107eb8582610770565b865550610852565b601f1984166108018661052f565b5f5b8281101561082857848901518255600182019150602085019450602081019050610803565b868310156108455784890151610841601f891682610754565b8355505b6001600288020188555050505b505050505050565b5f6020820190508181035f8301526108728184610541565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6108b182610663565b91506108bc83610663565b92508282019050808211156108d4576108d361087a565b5b9291505056fea264697066735822122039a530133d747adb5dc07fe92ab69bfc5e9af0e823a9563f32a3974379e87da564687970634300000200330000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000',
					);
					expect(_tx.input).toBe(
						'0x608060405234801562000010575f80fd5b5060405162000e6238038062000e628339818101604052810190620000369190620001da565b806001908162000047919062000460565b505f80819055505062000544565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b620000b6826200006e565b810181811067ffffffffffffffff82111715620000d857620000d76200007e565b5b80604052505050565b5f620000ec62000055565b9050620000fa8282620000ab565b919050565b5f67ffffffffffffffff8211156200011c576200011b6200007e565b5b62000127826200006e565b9050602081019050919050565b5f5b838110156200015357808201518184015260208101905062000136565b5f8484015250505050565b5f620001746200016e84620000ff565b620000e1565b9050828152602081018484840111156200019357620001926200006a565b5b620001a084828562000134565b509392505050565b5f82601f830112620001bf57620001be62000066565b5b8151620001d18482602086016200015e565b91505092915050565b5f60208284031215620001f257620001f16200005e565b5b5f82015167ffffffffffffffff81111562000212576200021162000062565b5b6200022084828501620001a8565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200027857607f821691505b6020821081036200028e576200028d62000233565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620002f27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620002b5565b620002fe8683620002b5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f62000348620003426200033c8462000316565b6200031f565b62000316565b9050919050565b5f819050919050565b620003638362000328565b6200037b62000372826200034f565b848454620002c1565b825550505050565b5f90565b6200039162000383565b6200039e81848462000358565b505050565b5b81811015620003c557620003b95f8262000387565b600181019050620003a4565b5050565b601f8211156200041457620003de8162000294565b620003e984620002a6565b81016020851015620003f9578190505b620004116200040885620002a6565b830182620003a3565b50505b505050565b5f82821c905092915050565b5f620004365f198460080262000419565b1980831691505092915050565b5f62000450838362000425565b9150826002028217905092915050565b6200046b8262000229565b67ffffffffffffffff8111156200048757620004866200007e565b5b62000493825462000260565b620004a0828285620003c9565b5f60209050601f831160018114620004d6575f8415620004c1578287015190505b620004cd858262000443565b8655506200053c565b601f198416620004e68662000294565b5f5b828110156200050f57848901518255600182019150602085019450602081019050620004e8565b868310156200052f57848901516200052b601f89168262000425565b8355505b6001600288020188555050505b505050505050565b61091080620005525f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae321714610074578063d09de08a14610092575b5f80fd5b61005d600480360381019061005891906103a9565b61009c565b60405161006b929190610484565b60405180910390f35b61007c6101b7565b60405161008991906104b2565b60405180910390f35b61009a610247565b005b5f60607f0d363f2fba46ab11b6db8da0125b0d5484787c44e265b48810735998bab12b756001846040516100d19291906105c2565b60405180910390a182600190816100e8919061078b565b507f7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e6001604051610119919061085a565b60405180910390a1600180808054610130906104ff565b80601f016020809104026020016040519081016040528092919081815260200182805461015c906104ff565b80156101a75780601f1061017e576101008083540402835291602001916101a7565b820191905f5260205f20905b81548152906001019060200180831161018a57829003601f168201915b5050505050905091509150915091565b6060600180546101c6906104ff565b80601f01602080910402602001604051908101604052809291908181526020018280546101f2906104ff565b801561023d5780601f106102145761010080835404028352916020019161023d565b820191905f5260205f20905b81548152906001019060200180831161022057829003601f168201915b5050505050905090565b60015f5461025591906108a7565b5f81905550565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102bb82610275565b810181811067ffffffffffffffff821117156102da576102d9610285565b5b80604052505050565b5f6102ec61025c565b90506102f882826102b2565b919050565b5f67ffffffffffffffff82111561031757610316610285565b5b61032082610275565b9050602081019050919050565b828183375f83830152505050565b5f61034d610348846102fd565b6102e3565b90508281526020810184848401111561036957610368610271565b5b61037484828561032d565b509392505050565b5f82601f8301126103905761038f61026d565b5b81356103a084826020860161033b565b91505092915050565b5f602082840312156103be576103bd610265565b5b5f82013567ffffffffffffffff8111156103db576103da610269565b5b6103e78482850161037c565b91505092915050565b5f8115159050919050565b610404816103f0565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610441578082015181840152602081019050610426565b5f8484015250505050565b5f6104568261040a565b6104608185610414565b9350610470818560208601610424565b61047981610275565b840191505092915050565b5f6040820190506104975f8301856103fb565b81810360208301526104a9818461044c565b90509392505050565b5f6020820190508181035f8301526104ca818461044c565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051657607f821691505b602082108103610529576105286104d2565b5b50919050565b5f819050815f5260205f209050919050565b5f815461054d816104ff565b6105578186610414565b9450600182165f81146105715760018114610587576105b9565b60ff1983168652811515602002860193506105b9565b6105908561052f565b5f5b838110156105b157815481890152600182019150602081019050610592565b808801955050505b50505092915050565b5f6040820190508181035f8301526105da8185610541565b905081810360208301526105ee818461044c565b90509392505050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106417fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610606565b61064b8683610606565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61068f61068a61068584610663565b61066c565b610663565b9050919050565b5f819050919050565b6106a883610675565b6106bc6106b482610696565b848454610612565b825550505050565b5f90565b6106d06106c4565b6106db81848461069f565b505050565b5b818110156106fe576106f35f826106c8565b6001810190506106e1565b5050565b601f821115610743576107148161052f565b61071d846105f7565b8101602085101561072c578190505b610740610738856105f7565b8301826106e0565b50505b505050565b5f82821c905092915050565b5f6107635f1984600802610748565b1980831691505092915050565b5f61077b8383610754565b9150826002028217905092915050565b6107948261040a565b67ffffffffffffffff8111156107ad576107ac610285565b5b6107b782546104ff565b6107c2828285610702565b5f60209050601f8311600181146107f3575f84156107e1578287015190505b6107eb8582610770565b865550610852565b601f1984166108018661052f565b5f5b8281101561082857848901518255600182019150602085019450602081019050610803565b868310156108455784890151610841601f891682610754565b8355505b6001600288020188555050505b505050505050565b5f6020820190508181035f8301526108728184610541565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6108b182610663565b91506108bc83610663565b92508282019050808211156108d4576108d361087a565b5b9291505056fea264697066735822122039a530133d747adb5dc07fe92ab69bfc5e9af0e823a9563f32a3974379e87da564687970634300000200330000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000',
					);
					expect(returnFormat).toBe(QRL_DATA_FORMAT);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(BigInt(36916)) as any;
				});

			const deploy = contract.deploy({
				data: GreeterBytecode,
				arguments: ['My Greeting'],
			});

			const result = await deploy.estimateGas(sendOptions, QRL_DATA_FORMAT);
			expect(result).toStrictEqual(BigInt(36916));

			spyTx.mockClear();
			spyEstimateGas.mockClear();
		});
		it('estimateGas should work for the deploy function using data web3config', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: { contractDataInputFill: 'data' },
			});

			const contract = new Contract(GreeterAbi, web3Context);

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyEstimateGas = jest
				.spyOn(qrl, 'estimateGas')
				.mockImplementationOnce((_objInstance, _tx, _block, returnFormat) => {
					expect(_block).toBe('latest');
					expect(_tx.to).toBeUndefined();
					expect(_tx.from).toStrictEqual(sendOptions.from);
					expect(_tx.data).toBe(
						'0x608060405234801562000010575f80fd5b5060405162000e6238038062000e628339818101604052810190620000369190620001da565b806001908162000047919062000460565b505f80819055505062000544565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b620000b6826200006e565b810181811067ffffffffffffffff82111715620000d857620000d76200007e565b5b80604052505050565b5f620000ec62000055565b9050620000fa8282620000ab565b919050565b5f67ffffffffffffffff8211156200011c576200011b6200007e565b5b62000127826200006e565b9050602081019050919050565b5f5b838110156200015357808201518184015260208101905062000136565b5f8484015250505050565b5f620001746200016e84620000ff565b620000e1565b9050828152602081018484840111156200019357620001926200006a565b5b620001a084828562000134565b509392505050565b5f82601f830112620001bf57620001be62000066565b5b8151620001d18482602086016200015e565b91505092915050565b5f60208284031215620001f257620001f16200005e565b5b5f82015167ffffffffffffffff81111562000212576200021162000062565b5b6200022084828501620001a8565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200027857607f821691505b6020821081036200028e576200028d62000233565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620002f27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620002b5565b620002fe8683620002b5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f62000348620003426200033c8462000316565b6200031f565b62000316565b9050919050565b5f819050919050565b620003638362000328565b6200037b62000372826200034f565b848454620002c1565b825550505050565b5f90565b6200039162000383565b6200039e81848462000358565b505050565b5b81811015620003c557620003b95f8262000387565b600181019050620003a4565b5050565b601f8211156200041457620003de8162000294565b620003e984620002a6565b81016020851015620003f9578190505b620004116200040885620002a6565b830182620003a3565b50505b505050565b5f82821c905092915050565b5f620004365f198460080262000419565b1980831691505092915050565b5f62000450838362000425565b9150826002028217905092915050565b6200046b8262000229565b67ffffffffffffffff8111156200048757620004866200007e565b5b62000493825462000260565b620004a0828285620003c9565b5f60209050601f831160018114620004d6575f8415620004c1578287015190505b620004cd858262000443565b8655506200053c565b601f198416620004e68662000294565b5f5b828110156200050f57848901518255600182019150602085019450602081019050620004e8565b868310156200052f57848901516200052b601f89168262000425565b8355505b6001600288020188555050505b505050505050565b61091080620005525f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae321714610074578063d09de08a14610092575b5f80fd5b61005d600480360381019061005891906103a9565b61009c565b60405161006b929190610484565b60405180910390f35b61007c6101b7565b60405161008991906104b2565b60405180910390f35b61009a610247565b005b5f60607f0d363f2fba46ab11b6db8da0125b0d5484787c44e265b48810735998bab12b756001846040516100d19291906105c2565b60405180910390a182600190816100e8919061078b565b507f7d7846723bda52976e0286c6efffee937ee9f76817a867ec70531ad29fb1fc0e6001604051610119919061085a565b60405180910390a1600180808054610130906104ff565b80601f016020809104026020016040519081016040528092919081815260200182805461015c906104ff565b80156101a75780601f1061017e576101008083540402835291602001916101a7565b820191905f5260205f20905b81548152906001019060200180831161018a57829003601f168201915b5050505050905091509150915091565b6060600180546101c6906104ff565b80601f01602080910402602001604051908101604052809291908181526020018280546101f2906104ff565b801561023d5780601f106102145761010080835404028352916020019161023d565b820191905f5260205f20905b81548152906001019060200180831161022057829003601f168201915b5050505050905090565b60015f5461025591906108a7565b5f81905550565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102bb82610275565b810181811067ffffffffffffffff821117156102da576102d9610285565b5b80604052505050565b5f6102ec61025c565b90506102f882826102b2565b919050565b5f67ffffffffffffffff82111561031757610316610285565b5b61032082610275565b9050602081019050919050565b828183375f83830152505050565b5f61034d610348846102fd565b6102e3565b90508281526020810184848401111561036957610368610271565b5b61037484828561032d565b509392505050565b5f82601f8301126103905761038f61026d565b5b81356103a084826020860161033b565b91505092915050565b5f602082840312156103be576103bd610265565b5b5f82013567ffffffffffffffff8111156103db576103da610269565b5b6103e78482850161037c565b91505092915050565b5f8115159050919050565b610404816103f0565b82525050565b5f81519050919050565b5f82825260208201905092915050565b5f5b83811015610441578082015181840152602081019050610426565b5f8484015250505050565b5f6104568261040a565b6104608185610414565b9350610470818560208601610424565b61047981610275565b840191505092915050565b5f6040820190506104975f8301856103fb565b81810360208301526104a9818461044c565b90509392505050565b5f6020820190508181035f8301526104ca818461044c565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061051657607f821691505b602082108103610529576105286104d2565b5b50919050565b5f819050815f5260205f209050919050565b5f815461054d816104ff565b6105578186610414565b9450600182165f81146105715760018114610587576105b9565b60ff1983168652811515602002860193506105b9565b6105908561052f565b5f5b838110156105b157815481890152600182019150602081019050610592565b808801955050505b50505092915050565b5f6040820190508181035f8301526105da8185610541565b905081810360208301526105ee818461044c565b90509392505050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026106417fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610606565b61064b8683610606565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61068f61068a61068584610663565b61066c565b610663565b9050919050565b5f819050919050565b6106a883610675565b6106bc6106b482610696565b848454610612565b825550505050565b5f90565b6106d06106c4565b6106db81848461069f565b505050565b5b818110156106fe576106f35f826106c8565b6001810190506106e1565b5050565b601f821115610743576107148161052f565b61071d846105f7565b8101602085101561072c578190505b610740610738856105f7565b8301826106e0565b50505b505050565b5f82821c905092915050565b5f6107635f1984600802610748565b1980831691505092915050565b5f61077b8383610754565b9150826002028217905092915050565b6107948261040a565b67ffffffffffffffff8111156107ad576107ac610285565b5b6107b782546104ff565b6107c2828285610702565b5f60209050601f8311600181146107f3575f84156107e1578287015190505b6107eb8582610770565b865550610852565b601f1984166108018661052f565b5f5b8281101561082857848901518255600182019150602085019450602081019050610803565b868310156108455784890151610841601f891682610754565b8355505b6001600288020188555050505b505050505050565b5f6020820190508181035f8301526108728184610541565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6108b182610663565b91506108bc83610663565b92508282019050808211156108d4576108d361087a565b5b9291505056fea264697066735822122039a530133d747adb5dc07fe92ab69bfc5e9af0e823a9563f32a3974379e87da564687970634300000200330000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e67000000000000000000000000000000000000000000',
					);
					expect(returnFormat).toBe(QRL_DATA_FORMAT);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(BigInt(36916)) as any;
				});

			const deploy = contract.deploy({
				data: GreeterBytecode,
				arguments: ['My Greeting'],
			});

			const result = await deploy.estimateGas(sendOptions, QRL_DATA_FORMAT);
			expect(result).toStrictEqual(BigInt(36916));

			spyTx.mockClear();
			spyEstimateGas.mockClear();
		});

		it('estimateGas should work for contract method', async () => {
			const arg = 'Hello';

			const contract = new Contract(GreeterAbi, { data: GreeterBytecode });

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const spyEstimateGas = jest
				.spyOn(qrl, 'estimateGas')
				.mockImplementationOnce((_objInstance, _tx, _block) => {
					expect(_block).toBe('latest');
					expect(_tx.to).toStrictEqual(deployedAddr);
					expect(_tx.from).toStrictEqual(sendOptions.from);
					expect(_tx.data).toBe(
						'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000',
					);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(BigInt(36916)) as any;
				});

			const deployedContract = await contract
				.deploy({
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const result = await deployedContract.methods.setGreeting(arg).estimateGas(sendOptions);
			expect(result).toStrictEqual(BigInt(36916));

			spyTx.mockClear();
			spyEstimateGas.mockClear();
		});

		it('encodeABI should work for contract method', async () => {
			const arg = 'Hello';

			const contract = new Contract(GreeterAbi, { data: GreeterBytecode });

			const spyTx = jest.spyOn(qrl, 'sendTransaction').mockImplementation(() => {
				const newContract = contract.clone();
				newContract.options.address = deployedAddr;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return Promise.resolve(newContract) as any;
			});

			const deployedContract = await contract
				.deploy({
					arguments: ['My Greeting'],
				})
				.send(sendOptions);

			const result = deployedContract.methods.setGreeting(arg).encodeABI();

			expect(result).toBe(
				'0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000',
			);

			spyTx.mockClear();
		});

		it('contract method send without contract address should throw error', async () => {
			const arg = 'Hello';

			const contract = new Contract(GreeterAbi);

			await expect(async () => {
				await contract.methods.setGreeting(arg).send(sendOptions);
			}).rejects.toThrow(new Web3ContractError('Contract address not specified'));
		});

		it('contract method send without from address should throw error', async () => {
			const gas = '1000000';
			const sendOptionsSpecial = { gas };
			const arg = 'Hello';

			const contract = new Contract(GreeterAbi);
			contract.options.address = 'Q12364916b10Ae90076dDa6dE756EE1395BB69ec2';

			/* eslint-disable no-useless-escape */
			await expect(async () => {
				await contract.methods.setGreeting(arg).send(sendOptionsSpecial);
			}).rejects.toThrow('Contract "from" address not specified');
		});

		it('contract method createAccessList should work', async () => {
			const fromAddr: Address = 'Q20bc23D0598b12c34cBDEf1fae439Ba8744DB426';
			const result: AccessListResult = {
				accessList: [
					{
						address: deployedAddr,
						storageKeys: [
							'0x0000000000000000000000000000000000000000000000000000000000000001',
						],
					},
				],
				gasUsed: '0x644e',
			};

			const contract = new Contract(GreeterAbi, deployedAddr);

			const spyQRLCall = jest
				.spyOn(qrl, 'createAccessList')
				.mockImplementation((_objInstance, _tx) => {
					expect(_tx.to).toStrictEqual(deployedAddr);
					expect(_tx.input).toBe('0xcfae3217');
					expect(_tx.from).toBe(fromAddr);
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(result) as any; // contract class should decode encodedArg
				});

			const res = await contract.methods.greet().createAccessList({ from: fromAddr });
			expect(res).toStrictEqual(result);

			spyQRLCall.mockClear();
		});

		it('contract method createAccessList should work using data with web3config', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: { contractDataInputFill: 'data' },
			});
			const fromAddr: Address = 'Q20bc23D0598b12c34cBDEf1fae439Ba8744DB426';
			const result: AccessListResult = {
				accessList: [
					{
						address: deployedAddr,
						storageKeys: [
							'0x0000000000000000000000000000000000000000000000000000000000000001',
						],
					},
				],
				gasUsed: '0x644e',
			};

			const contract = new Contract(GreeterAbi, deployedAddr, web3Context);

			const spyEthCall = jest
				.spyOn(qrl, 'createAccessList')
				.mockImplementation((_objInstance, _tx) => {
					expect(_tx.to).toStrictEqual(deployedAddr);
					expect(_tx.data).toBe('0xcfae3217');
					expect(_tx.from).toBe(fromAddr);
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(result) as any; // contract class should decode encodedArg
				});

			const res = await contract.methods.greet().createAccessList({ from: fromAddr });
			expect(res).toStrictEqual(result);

			spyEthCall.mockClear();
		});
		it('contract method createAccessList should work using data with web3config with both input and data', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: { contractDataInputFill: 'both' },
			});
			const fromAddr: Address = 'Q20bc23D0598b12c34cBDEf1fae439Ba8744DB426';
			const result: AccessListResult = {
				accessList: [
					{
						address: deployedAddr,
						storageKeys: [
							'0x0000000000000000000000000000000000000000000000000000000000000001',
						],
					},
				],
				gasUsed: '0x644e',
			};

			const contract = new Contract(GreeterAbi, deployedAddr, web3Context);

			const spyEthCall = jest
				.spyOn(qrl, 'createAccessList')
				.mockImplementation((_objInstance, _tx) => {
					expect(_tx.to).toStrictEqual(deployedAddr);
					expect(_tx.data).toBe('0xcfae3217');
					expect(_tx.input).toBe('0xcfae3217');
					expect(_tx.from).toBe(fromAddr);
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Promise.resolve(result) as any; // contract class should decode encodedArg
				});

			const res = await contract.methods.greet().createAccessList({ from: fromAddr });
			expect(res).toStrictEqual(result);

			spyEthCall.mockClear();
		});

		it('should correctly apply provided Web3Context to new Contract instance', () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: { handleRevert: true, defaultTransactionType: '0x2' },
			});
			const contract = new Contract(GreeterAbi, web3Context);
			expect(contract.config).toStrictEqual(web3Context.config);
		});
	});
});
