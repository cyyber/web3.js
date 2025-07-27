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

import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';

import Web3QRL from '../../src/index';

jest.mock('@theqrl/web3-rpc-methods');

describe('Web3QRL.calculateFeeData', () => {
	let web3QRL: Web3QRL;

	beforeAll(() => {
		web3QRL = new Web3QRL('http://127.0.0.1:8545');
	});

	it('should return call getBlockByNumber, getMaxPriorityFeePerGas', async () => {
		await web3QRL.calculateFeeData();
		// web3QRL.getBlock = jest.fn();
		expect(qrlRpcMethods.getBlockByNumber).toHaveBeenCalledWith(
			web3QRL.requestManager,
			'latest',
			false,
		);
		expect(qrlRpcMethods.getMaxPriorityFeePerGas).toHaveBeenCalledWith(
			web3QRL.requestManager,
		);
	});

	it('should calculate fee data', async () => {
		const baseFeePerGas = BigInt(1000);
		const maxPriorityFeePerGas = BigInt(100);
		const baseFeePerGasFactor = BigInt(3);

		jest.spyOn(qrlRpcMethods, 'getBlockByNumber').mockReturnValueOnce({
			baseFeePerGas,
		} as any);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		jest.spyOn(qrlRpcMethods, 'getMaxPriorityFeePerGas').mockReturnValueOnce(
			maxPriorityFeePerGas as any,
		);

		const feeData = await web3QRL.calculateFeeData(baseFeePerGasFactor, maxPriorityFeePerGas);
		expect(feeData).toMatchObject({
			maxFeePerGas: baseFeePerGas * baseFeePerGasFactor + maxPriorityFeePerGas,
			maxPriorityFeePerGas,
			baseFeePerGas,
		});
	});

	it('should calculate fee data based on `alternativeMaxPriorityFeePerGas` if `getMaxPriorityFeePerGas` did not return a value', async () => {
		const baseFeePerGas = BigInt(1000);
		const alternativeMaxPriorityFeePerGas = BigInt(700);
		const baseFeePerGasFactor = BigInt(3);

		jest.spyOn(qrlRpcMethods, 'getBlockByNumber').mockReturnValueOnce({
			baseFeePerGas,
		} as any);
		const feeData = await web3QRL.calculateFeeData(
			baseFeePerGasFactor,
			alternativeMaxPriorityFeePerGas,
		);
		expect(feeData).toMatchObject({
			maxFeePerGas: baseFeePerGas * baseFeePerGasFactor + alternativeMaxPriorityFeePerGas,
			maxPriorityFeePerGas: alternativeMaxPriorityFeePerGas,
			baseFeePerGas,
		});
	});
});
