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

import { encodeFunctionCall, encodeParameter } from '@theqrl/web3-qrl-abi';

import { GreeterAbi, GreeterBytecode } from '../shared_fixtures/build/Greeter';

export const GREETER_GREETING = 'solyent green is people';
export const GREETER_DEPLOYMENT_DATA = `${GreeterBytecode}${encodeParameter(
	'string',
	GREETER_GREETING,
).slice(2)}`;

const setGreetingAbi = GreeterAbi.find(
	item => item.type === 'function' && item.name === 'setGreeting',
);

export const GREETER_SET_GREETING_42_DATA = encodeFunctionCall(setGreetingAbi!, ['42']);
