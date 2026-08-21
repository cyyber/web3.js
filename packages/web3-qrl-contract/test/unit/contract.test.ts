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
import { ContractExecutionError, Web3ContractError } from '@theqrl/web3-errors';
import { Web3Context } from '@theqrl/web3-core';
import { Contract } from '../../src';
import { sampleStorageContractABI } from '../fixtures/storage';
import { GreeterAbi, GreeterBytecode } from '../shared_fixtures/build/Greeter';
import { AllGetPastEventsData, getLogsData, getPastEventsData } from '../fixtures/unitTestFixtures';
import { getSystemTestProvider, isHttp, itIf } from '../fixtures/system_test_utils';
import { sqrcTn1Abi } from '../fixtures/sqrcTn1';
import { SQRCTF1TokenAbi } from '../shared_fixtures/build/SQRCTF1Token';
import { processAsync } from '../shared_fixtures/utils';

jest.mock('@theqrl/web3-qrl');

const GREETER_DEPLOYMENT_DATA = `${GreeterBytecode}000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b4d79204772656574696e670000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;

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
			const contract = new Contract([], 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa');

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
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			expect(contract).toBeInstanceOf(Contract);
		});

		it('should init with abi, address and options', () => {
			const contract = new Contract([], 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa', {
				gas: '123',
			});

			expect(contract).toBeInstanceOf(Contract);
		});

		it('should init with abi, address, options and context', () => {
			const contract = new Contract(
				[],
				'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
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
				// A `bounds` object (request/response safety limits) was added to
				// HttpProvider; deep-equal on a provider instance must expect it.
				bounds: {
					connectionTimeout: 30000,
					requestTimeout: 120000,
					maxResponseBytes: 10485760,
					maxInFlightRequests: 256,
				},
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
				// A `bounds` object (request/response safety limits) was added to
				// HttpProvider; deep-equal on a provider instance must expect it.
				bounds: {
					connectionTimeout: 30000,
					requestTimeout: 120000,
					maxResponseBytes: 10485760,
					maxInFlightRequests: 256,
				},
			});
		});

		it('should pass the returnDataFormat to `_parseAndSetAddress` and `_parseAndSetJsonInterface`', () => {
			const contract = new Contract([], '', QRL_DATA_FORMAT);

			// @ts-expect-error run protected method
			const parseAndSetAddressSpy = jest.spyOn(contract, '_parseAndSetAddress');
			contract.options.address = 'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006e599da0bff7a6598ac1224e4985430bf16458a4';

			expect(parseAndSetAddressSpy).toHaveBeenCalledWith(
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006e599da0bff7a6598ac1224e4985430bf16458a4',
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
			contract.options.address = 'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006e599da0bff7a6598ac1224e4985430bf16458a4';

			expect(parseAndSetAddressSpy).toHaveBeenCalledWith(
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006e599da0bff7a6598ac1224e4985430bf16458a4',
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
			contract.options.address = 'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006e599da0bff7a6598ac1224e4985430bf16458a4';

			expect(parseAndSetAddressSpy).toHaveBeenCalledWith(
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006e599da0bff7a6598ac1224e4985430bf16458a4',
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
		const deployedAddr = 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020Bc23D0598b12c34cBdeF1FaE439ba8744DB426';

		beforeEach(() => {
			sendOptions = {
				from: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2',
				gas: '1000000',
			};
		});

		it('should deploy contract with input property', async () => {
			const input = GREETER_DEPLOYMENT_DATA;
			const contract = new Contract(GreeterAbi);

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
			const data = GREETER_DEPLOYMENT_DATA;
			const contract = new Contract(GreeterAbi);

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

		it('send method on deployed contract should work using input', async () => {
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi);
			sendOptions = {
				from: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2',
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
						'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
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
				from: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2',
				gas: '1000000',
				data: '0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					expect(_tx.data).toBeDefined();
					if (
						_tx.data ===
						'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
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
					defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
				},
			});
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi, web3Context);
			sendOptions = {
				from: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					if (
						_tx.data ===
						'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
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
					defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
				},
			});
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi, web3Context);
			sendOptions = {
				from: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					if (
						_tx.data ===
						'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
					) {
						// eslint-disable-next-line
						expect(_tx.input).toStrictEqual(
							'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
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
					defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
				},
			});
			const arg = 'Hello';
			const contract = new Contract(GreeterAbi, web3Context);
			sendOptions = {
				from: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2',
				gas: '1000000',
			};
			const spyTx = jest
				.spyOn(qrl, 'sendTransaction')
				.mockImplementation((_objInstance, _tx) => {
					const newContract = contract.clone();
					newContract.options.address = deployedAddr;
					if (
						_tx.input ===
						'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
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
				'0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
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
				'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
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
			const contract = new Contract([], 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa');

			const defaultAddr = 'Q0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d7e30ae310c1d1800f5b641baa7af95b2e1fd98c';
			expect(contract.defaultAccount).toBeUndefined();
			contract.defaultAccount = defaultAddr;
			expect(contract.defaultAccount).toStrictEqual(defaultAddr);

			const defaultBlock = '0xC43A';
			expect(contract.defaultBlock).toBe('latest');
			contract.defaultBlock = defaultBlock;
			expect(contract.defaultBlock).toStrictEqual(defaultBlock);

			const defaultHardfork = 'constantinople';
			expect(contract.defaultHardfork).toBe('zond');
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
			const addr = 'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701';
			const contract = new Contract(
				[],
				'',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			contract.options.address = addr;
			expect(contract.options.address).toStrictEqual(addr);
		});

		it('should set, at the constructor, and later get jsonInterface', () => {
			const contract = new Contract(
				sampleStorageContractABI,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			expect(contract.options.jsonInterface).toMatchObject(sampleStorageContractABI);
		});

		it('should set and get jsonInterface', () => {
			const contract = new Contract(
				sampleStorageContractABI,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			contract.options.jsonInterface = SQRCTF1TokenAbi;
			expect(contract.options.jsonInterface).toMatchObject(
				SQRCTF1TokenAbi.filter(abi => abi.type !== 'error'),
			);
		});

		it('should be able to call a payable method', async () => {
			const contract = new Contract(
				sqrcTn1Abi,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701');
					expect(_tx.input).toBe(
						'0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with data as a contract init option', async () => {
			const contract = new Contract(
				sqrcTn1Abi,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123', dataInputFill: 'data' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701');
					expect(_tx.data).toBe(
						'0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with input as a contract init option', async () => {
			const contract = new Contract(
				sqrcTn1Abi,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123', dataInputFill: 'input' },
				{ config: { defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa' } },
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701');
					expect(_tx.input).toBe(
						'0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with data as a web3Context option', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'data',
					defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
				},
			});
			const contract = new Contract(
				sqrcTn1Abi,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123' },
				web3Context,
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701');
					expect(_tx.data).toBe(
						'0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa', 1).call(),
			).resolves.toBeTruthy();

			spyQRLCall.mockClear();
		});

		it('should be able to call a payable method with both data and input as a web3Context option', async () => {
			const expectedProvider = 'http://127.0.0.1:8545';
			const web3Context = new Web3Context({
				provider: expectedProvider,
				config: {
					contractDataInputFill: 'both',
					defaultAccount: 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa',
				},
			});
			const contract = new Contract(
				sqrcTn1Abi,
				'Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701',
				{ gas: '123' },
				web3Context,
			);

			const spyQRLCall = jest
				.spyOn(qrl, 'call')
				.mockImplementation(async (_objInstance, _tx) => {
					expect(_tx.to).toBe('Q00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001230b93ffd14F2f022039675FA3fC3A46ee4C701');
					expect(_tx.data).toBe(
						'0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
					);
					expect(_tx.input).toBe(
						'0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
					);
					return '0x00';
				});

			await expect(
				contract.methods.approve('Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000219ab540356cbb839cbe05303d7705fa', 1).call(),
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
					expect(_params.address).toBe(`Q${deployedAddr.slice(1).toLocaleLowerCase()}`);
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
					expect(_params.address).toBe(`Q${deployedAddr.slice(1).toLocaleLowerCase()}`);
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
					expect(_params.address).toBe(`Q${deployedAddr.slice(1).toLocaleLowerCase()}`);
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
					expect(_params.address).toBe(`Q${deployedAddr.slice(1).toLocaleLowerCase()}`);
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
					expect(_params.address).toBe(`Q${deployedAddr.slice(1).toLocaleLowerCase()}`);
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
				GREETER_DEPLOYMENT_DATA,
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
						GREETER_DEPLOYMENT_DATA,
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
						GREETER_DEPLOYMENT_DATA,
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
						GREETER_DEPLOYMENT_DATA,
					);
					expect(_tx.input).toBe(
						GREETER_DEPLOYMENT_DATA,
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
						GREETER_DEPLOYMENT_DATA,
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
						'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
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
				'0xa4136862000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000548656c6c6f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
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
			contract.options.address = 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012364916b10ae90076dda6de756ee1395bb69ec2';

			await expect(async () => {
				await contract.methods.setGreeting(arg).send(sendOptionsSpecial);
			}).rejects.toThrow('Contract "from" address not specified');
		});

		it('contract method createAccessList should work', async () => {
			const fromAddr: Address = 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020Bc23D0598b12c34cBdeF1FaE439ba8744DB426';
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
			const fromAddr: Address = 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020Bc23D0598b12c34cBdeF1FaE439ba8744DB426';
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
			const fromAddr: Address = 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020Bc23D0598b12c34cBdeF1FaE439ba8744DB426';
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

		it('contract method createAccessList should decode revert error according to EIP-838', async () => {
			const fromAddr: Address = 'Q000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020Bc23D0598b12c34cBdeF1FaE439ba8744DB426';

			// ABI augmented with an `Unauthorized()` custom error (selector 0x82b42900)
			const abiWithError = [
				...GreeterAbi,
				{ type: 'error', name: 'Unauthorized', inputs: [] },
			] as unknown as typeof GreeterAbi;

			const contract = new Contract(abiWithError, deployedAddr);

			const spyQRLCreateAccessList = jest
				.spyOn(qrl, 'createAccessList')
				.mockImplementation((): any => {
					// mimic a provider rejecting the createAccessList call with EIP-838 revert data
					return Promise.reject(
						new ContractExecutionError({
							code: 3,
							message: 'execution reverted',
							data: '0x82b42900',
						}),
					);
				});

			let error: ContractExecutionError | undefined;
			try {
				await contract.methods.greet().createAccessList({ from: fromAddr });
			} catch (err: unknown) {
				error = err as ContractExecutionError;
			}

			// The catch inside _contractMethodCreateAccessList can only decode the error
			// if the createAccessList promise is awaited before returning.
			expect(error).toBeInstanceOf(ContractExecutionError);
			expect(error?.innerError).toMatchObject({
				errorName: 'Unauthorized',
				errorSignature: 'Unauthorized()',
			});

			spyQRLCreateAccessList.mockClear();
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
