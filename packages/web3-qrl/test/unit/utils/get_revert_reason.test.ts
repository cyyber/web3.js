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
import { Web3Context } from '@theqrl/web3-core';
import { DEFAULT_RETURN_FORMAT } from '@theqrl/web3-types';

import * as RpcMethodWrappers from '../../../src/rpc_method_wrappers';
import * as GetRevertReason from '../../../src/utils/get_revert_reason';
import { SimpleRevertAbi } from '../../fixtures/simple_revert';

describe('getRevertReason', () => {
	const web3Context = new Web3Context();

	it('should use the call rpc wrapper', async () => {
		const callSpy = jest.spyOn(RpcMethodWrappers, 'call').mockImplementation();

		const transaction = {
			from: 'Q2CCeCC72b4C8C0d943bEcFb1E67c4d8996D2F24d138E62dd19Dde2dA366C4faFff063A86501141d64AC7f273CCAE5053fD059722A4E9453170cb40F569872A02',
			to: 'Q224D6a535f8991Cf611b3447F8DfE1059dbEd07c540A53e9E36D37b2ecEEA19013F66E973b207B0467a5A793203b27456B7aa1CEE00dF1e385D1eC5272718eb7',
			data: '0x819f48fe',
			maxPriorityFeePerGas: '0x0',
			maxFeePerGas: '0x15ab8f14',
		};

		await GetRevertReason.getRevertReason(web3Context, transaction);

		expect(callSpy).toHaveBeenCalledWith(
			web3Context,
			transaction,
			web3Context.defaultBlock,
			DEFAULT_RETURN_FORMAT,
		);
	});

	it('should return undefined', async () => {
		jest.spyOn(RpcMethodWrappers, 'call').mockResolvedValueOnce(
			'0x000000000000000000000000000000000000000000000000000000000000000a',
		);

		const transaction = {
			from: 'Q2CCeCC72b4C8C0d943bEcFb1E67c4d8996D2F24d138E62dd19Dde2dA366C4faFff063A86501141d64AC7f273CCAE5053fD059722A4E9453170cb40F569872A02',
			to: 'Q224D6a535f8991Cf611b3447F8DfE1059dbEd07c540A53e9E36D37b2ecEEA19013F66E973b207B0467a5A793203b27456B7aa1CEE00dF1e385D1eC5272718eb7',
			data: '0x819f48fe',
			maxPriorityFeePerGas: '0x0',
			maxFeePerGas: '0x15ab8f14',
		};

		const result = await GetRevertReason.getRevertReason(web3Context, transaction);

		expect(result).toBeUndefined();
	});

	it('should call parseTransactionError without contractAbi', async () => {
		const expectedError = {
			jsonrpc: '2.0',
			id: 1,
			error: {
				code: -32000,
				message:
					'err: insufficient funds for gas * price + value: address Q2c904f21CadA2B93D87B58F2199879074Eb2630fac88827f5bDb896BA9d8653B8A2a8092643298d0C774adf0473f38429d6edb7abec4016CFDb88d4FD41F272c have 66 want 9983799287684 (supplied gas 26827)',
			},
		};
		const parseTransactionErrorSpy = jest
			.spyOn(GetRevertReason, 'parseTransactionError')
			.mockImplementation();
		jest.spyOn(RpcMethodWrappers, 'call').mockRejectedValueOnce(expectedError);

		const transaction = {
			from: 'Q2CCeCC72b4C8C0d943bEcFb1E67c4d8996D2F24d138E62dd19Dde2dA366C4faFff063A86501141d64AC7f273CCAE5053fD059722A4E9453170cb40F569872A02',
			to: 'Q224D6a535f8991Cf611b3447F8DfE1059dbEd07c540A53e9E36D37b2ecEEA19013F66E973b207B0467a5A793203b27456B7aa1CEE00dF1e385D1eC5272718eb7',
			data: '0x819f48fe',
			maxPriorityFeePerGas: '0x0',
			maxFeePerGas: '0x15ab8f14',
		};

		await GetRevertReason.getRevertReason(web3Context, transaction);

		expect(parseTransactionErrorSpy).toHaveBeenCalledWith(expectedError, undefined);
	});

	it('should call parseTransactionError with contractAbi', async () => {
		const expectedError = {
			jsonrpc: '2.0',
			id: 1,
			error: {
				code: -32000,
				message:
					'err: insufficient funds for gas * price + value: address Q2c904f21CadA2B93D87B58F2199879074Eb2630fac88827f5bDb896BA9d8653B8A2a8092643298d0C774adf0473f38429d6edb7abec4016CFDb88d4FD41F272c have 66 want 9983799287684 (supplied gas 26827)',
			},
		};
		const parseTransactionErrorSpy = jest
			.spyOn(GetRevertReason, 'parseTransactionError')
			.mockImplementation();
		jest.spyOn(RpcMethodWrappers, 'call').mockRejectedValueOnce(expectedError);

		const transaction = {
			from: 'Q2CCeCC72b4C8C0d943bEcFb1E67c4d8996D2F24d138E62dd19Dde2dA366C4faFff063A86501141d64AC7f273CCAE5053fD059722A4E9453170cb40F569872A02',
			to: 'Q224D6a535f8991Cf611b3447F8DfE1059dbEd07c540A53e9E36D37b2ecEEA19013F66E973b207B0467a5A793203b27456B7aa1CEE00dF1e385D1eC5272718eb7',
			data: '0x819f48fe',
			maxPriorityFeePerGas: '0x0',
			maxFeePerGas: '0x15ab8f14',
		};

		await GetRevertReason.getRevertReason(web3Context, transaction, SimpleRevertAbi);

		expect(parseTransactionErrorSpy).toHaveBeenCalledWith(expectedError, SimpleRevertAbi);
	});
});
