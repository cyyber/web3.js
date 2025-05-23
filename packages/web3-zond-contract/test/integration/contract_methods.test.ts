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
import { ContractExecutionError } from '@theqrl/web3-errors';
import { isNullish } from '@theqrl/web3-utils';
import { Contract } from '../../src';
import { BasicAbi, BasicBytecode } from '../shared_fixtures/build/Basic';
import { getSystemTestProvider, createTempAccount } from '../fixtures/system_test_utils';

describe('contract', () => {
	let contract: Contract<typeof BasicAbi>;
	let contractDeployed: Contract<typeof BasicAbi>;
	let deployOptions: Record<string, unknown>;
	let sendOptions: Record<string, unknown>;
	let acc: Record<string, string>;

	beforeAll(async () => {
		contract = new Contract(BasicAbi, undefined, {
			provider: getSystemTestProvider(),
		});
		acc = await createTempAccount();

		deployOptions = {
			data: BasicBytecode,
			arguments: [10, 'string init value'],
		};

		sendOptions = { from: acc.address, gas: '1000000' };

		contractDeployed = await contract.deploy(deployOptions).send(sendOptions);
	});

	describe('methods', () => {
		describe('call', () => {
			it('should retrieve the values', async () => {
				const result = await contractDeployed.methods.getValues().call();

				expect(result).toEqual({
					'0': BigInt(10),
					'1': 'string init value',
					'2': false,
					__length__: 3,
				});
			});

			it('should run call method of the contract if data is provided at initiation', async () => {
				const tempContract = new Contract(BasicAbi, {
					provider: getSystemTestProvider(),
					data: BasicBytecode,
					from: acc.address,
					gas: '1000000',
				});
				const deployedTempContract = await tempContract
					.deploy({ arguments: [10, 'string init value'] })
					.send();
				const res = await deployedTempContract.methods.getStringValue().call();
				expect(res).toBe('string init value');
			});

			describe('revert handling', () => {
				it('should returns the expected revert reason string', async () => {
					let error: ContractExecutionError | undefined;
					try {
						await contractDeployed.methods.reverts().call();
					} catch (err: any) {
						error = err;
					}

					// eslint-disable-next-line jest/no-standalone-expect
					expect(error).toBeDefined();
					// eslint-disable-next-line jest/no-standalone-expect
					expect(error?.innerError.message).toContain('REVERTED WITH REVERT');
				});
			});
		});

		describe('send', () => {
			it('should returns a receipt', async () => {
				const receipt = await contractDeployed.methods
					.setValues(1, 'string value', true)
					.send(sendOptions);

				expect(receipt).toEqual(
					expect.objectContaining({
						// status: BigInt(1),
						transactionHash: expect.any(String),
					}),
				);

				// To avoid issue with the `objectContaining` and `cypress` had to add
				// these expectations explicitly on each attribute
				expect(receipt.status).toEqual(BigInt(1));
			});

			it('should returns a receipt (EIP-1559, maxFeePerGas and maxPriorityFeePerGas specified)', async () => {
				const tempAcc = await createTempAccount();

				const sendOptionsLocal = { from: tempAcc.address /* gas: '1000000' */ };

				const contractLocal = await contract.deploy(deployOptions).send(sendOptionsLocal);
				const receipt = await contractLocal.methods
					.setValues(1, 'string value', true)
					.send({
						...sendOptionsLocal,
						maxFeePerGas: '0x59682F00', // 1.5 Gplanck
						maxPriorityFeePerGas: '0x1DCD6500', // .5 Gplanck
						type: '0x2',
					});

				expect(receipt).toEqual(
					expect.objectContaining({
						// status: BigInt(1),
						transactionHash: expect.any(String),
					}),
				);

				// To avoid issue with the `objectContaining` and `cypress` had to add
				// these expectations explicitly on each attribute
				expect(receipt.status).toEqual(BigInt(1));
			});

			it('should run send method of the contract if data is provided at initiation', async () => {
				const tempContract = new Contract(BasicAbi, {
					provider: getSystemTestProvider(),
					input: BasicBytecode,
					from: acc.address,
					gas: '1000000',
				});
				const deployedTempContract = await tempContract
					.deploy({ arguments: [10, 'string init value'] })
					.send();
				await deployedTempContract.methods.setValues(10, 'TEST', true).send();

				expect(await deployedTempContract.methods.getStringValue().call()).toBe('TEST');
			});

			it('should returns errors on reverts', async () => {
				await expect(
					contractDeployed.methods.reverts().send(sendOptions),
				).rejects.toMatchObject({
					name: 'TransactionRevertedWithoutReasonError',
					receipt: {
						cumulativeGasUsed: BigInt(21537),
						from: acc.address,
						gasUsed: BigInt(21537),
						logs: [],
						logsBloom:
							'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
						status: BigInt(0),
						to: isNullish(contractDeployed.options.address)
							? contractDeployed.options.address
							: `Z${contractDeployed.options.address.slice(1).toLowerCase()}`,
						transactionIndex: BigInt(0),
						type: BigInt(2),
					},
				});
			});
		});
	});
});
