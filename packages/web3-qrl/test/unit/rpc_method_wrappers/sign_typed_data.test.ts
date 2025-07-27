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
import {
	DEFAULT_RETURN_FORMAT,
	FMT_BYTES,
	FMT_NUMBER,
	Web3QRLExecutionAPI,
} from '@theqrl/web3-types';
import { qrlRpcMethods } from '@theqrl/web3-rpc-methods';
import { format } from '@theqrl/web3-utils';

import { signTypedData } from '../../../src/rpc_method_wrappers';
import { testData, mockRpcResponse } from './fixtures/sign_typed_data';

jest.mock('@theqrl/web3-rpc-methods');

describe('signTypedData', () => {
	let web3Context: Web3Context<Web3QRLExecutionAPI>;

	beforeAll(() => {
		web3Context = new Web3Context('http://127.0.0.1:8545');
	});

	it.each(testData)(
		`should call rpcMethods.signTypedData with expected parameters\nTitle: %s\nInput parameters: %s\n`,
		async (_, inputParameters) => {
			await signTypedData(web3Context, ...inputParameters, DEFAULT_RETURN_FORMAT);
			expect(qrlRpcMethods.signTypedData).toHaveBeenCalledWith(
				web3Context.requestManager,
				...inputParameters,
			);
		},
	);

	it.each(testData)(
		`should format mockRpcResponse using provided return format\nTitle: %s\nInput parameters: %s\n`,
		async (_, inputParameters) => {
			const expectedReturnFormat = { number: FMT_NUMBER.STR, bytes: FMT_BYTES.UINT8ARRAY };
			const expectedFormattedResult = format(
				{ format: 'bytes' },
				mockRpcResponse,
				expectedReturnFormat,
			);
			(qrlRpcMethods.signTypedData as jest.Mock).mockResolvedValueOnce(mockRpcResponse);

			const result = await signTypedData(
				web3Context,
				...inputParameters,
				expectedReturnFormat,
			);
			expect(result).toStrictEqual(expectedFormattedResult);
		},
	);
});
