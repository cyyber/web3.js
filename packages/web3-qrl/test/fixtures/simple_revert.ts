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

import { encodeFunctionCall, encodeParameter, encodeParameters } from '@theqrl/web3-qrl-abi';

import { SimpleRevertAbi, SimpleRevertBytecode } from '../shared_fixtures/build/SimpleRevert';

const revertSendAbi = SimpleRevertAbi.find(
	item => item.type === 'function' && item.name === 'revertSend',
);

export { SimpleRevertAbi, SimpleRevertBytecode as SimpleRevertDeploymentData };

export const encodeSimpleRevertSend = (value: string) =>
	encodeFunctionCall(revertSendAbi!, [value]);

export const SIMPLE_REVERT_CALL_REASON_DATA = encodeParameter(
	'string',
	'This is a call revert',
).slice(2);

export const SIMPLE_REVERT_SEND_REASON_DATA = encodeParameter(
	'string',
	'This is a send revert',
).slice(2);

export const SIMPLE_REVERT_CUSTOM_ERROR_DATA = encodeParameters(
	['uint256', 'string'],
	[42, 'This is an error with params'],
).slice(2);
