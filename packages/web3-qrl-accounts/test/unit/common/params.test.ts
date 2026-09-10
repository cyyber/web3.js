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

describe('[Common]: Parameter access for param(), paramByHardfork()', () => {
	it('Basic usage', () => {
		const c = new Common({ chain: Chain.Mainnet, qips: [] });
		expect(c.paramByHardfork('gasPrices', 'ecAdd', 'zond')).toEqual(BigInt(150));

		expect(c.param('gasPrices', 'ecAdd')).toEqual(BigInt(150));

		expect(c.param('gasPrices', 'notexistingvalue')).toEqual(BigInt(0));
		expect(c.paramByHardfork('gasPrices', 'notexistingvalue', 'zond')).toEqual(BigInt(0));
	});

	it('Error cases for param(), paramByHardfork()', () => {
		const c = new Common({ chain: Chain.Mainnet });

		expect(() => {
			c.paramByHardfork('gasPrizes', 'ecAdd', 'zond');
		}).toThrow('Topic gasPrizes not defined');

		c.setHardfork(Hardfork.Zond);
		expect(c.param('gasPrices', 'ecAdd')).toEqual(BigInt(150));
	});

	// NOTE(rgeraldes24): there are no param updates yet
	it('Parameter updates', () => {
		const c = new Common({ chain: Chain.Mainnet });

		expect(c.paramByHardfork('gasPrices', 'ecAdd', 'zond')).toEqual(BigInt(150));
	});

	// NOTE(rgeraldes24): there are no param updates yet
	it('Access by block number, paramByBlock()', () => {
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Zond });
		expect(c.paramByBlock('gasPrices', 'ecAdd', 4370000)).toEqual(BigInt(150));
		expect(c.paramByBlock('gasPrices', 'ecAdd', 4369999)).toEqual(BigInt(150));
	});
});
