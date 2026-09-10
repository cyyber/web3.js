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
import { Chain, Common, Hardfork } from '../../../src/common';

describe('[Common/QIPs]: Initialization / Chain params', () => {
	it('initializes on zond without extra QIPs', () => {
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Zond });
		expect(c.hardfork()).toEqual(Hardfork.Zond);
		expect(c.qips()).toEqual([]);
	});
});
