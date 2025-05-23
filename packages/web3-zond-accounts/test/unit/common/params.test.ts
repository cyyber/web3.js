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
		const c = new Common({ chain: Chain.Mainnet, eips: [] });
		expect(c.paramByHardfork('gasPrices', 'ecAdd', 'shanghai')).toEqual(BigInt(150));

		// NOTE(rgeraldes24): there are no param updates yet
		// c.setHardfork(Hardfork.Byzantium);
		// expect(c.param('gasPrices', 'ecAdd')).toEqual(BigInt(500));
		// c.setHardfork(Hardfork.Istanbul);
		expect(c.param('gasPrices', 'ecAdd')).toEqual(BigInt(150));
		// c.setHardfork(Hardfork.MuirGlacier);
		// expect(c.param('gasPrices', 'ecAdd')).toEqual(BigInt(150));

		expect(c.param('gasPrices', 'notexistingvalue')).toEqual(BigInt(0));
		expect(c.paramByHardfork('gasPrices', 'notexistingvalue', 'shanghai')).toEqual(BigInt(0));
	});

	it('Error cases for param(), paramByHardfork()', () => {
		const c = new Common({ chain: Chain.Mainnet });

		expect(() => {
			c.paramByHardfork('gasPrizes', 'ecAdd', 'byzantium');
		}).toThrow('Topic gasPrizes not defined');

		c.setHardfork(Hardfork.Shanghai);
		expect(c.param('gasPrices', 'ecAdd')).toEqual(BigInt(150));
	});

	// NOTE(rgeraldes24): there are no param updates yet
	it('Parameter updates', () => {
		const c = new Common({ chain: Chain.Mainnet });

		expect(c.paramByHardfork('gasPrices', 'ecAdd', 'shanghai')).toEqual(BigInt(150));

		// expect(c.paramByHardfork('pow', 'minerReward', 'byzantium')).toEqual(
		// 	BigInt(3000000000000000000),
		// );

		// NOTE(rgeraldes24): removed along EIP-1283
		// expect(c.paramByHardfork('gasPrices', 'netSstoreNoopGas', 'constantinople')).toEqual(
		// 	BigInt(200),
		// );

		// NOTE(rgeraldes24): removed along EIP-1283
		// expect(c.paramByHardfork('gasPrices', 'netSstoreNoopGas', 'petersburg')).toEqual(BigInt(0));
	});

	// NOTE(rgeraldes24): there are no param updates yet
	it('Access by block number, paramByBlock()', () => {
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Shanghai });
		expect(c.paramByBlock('gasPrices', 'ecAdd', 4370000)).toEqual(BigInt(150));
		expect(c.paramByBlock('gasPrices', 'ecAdd', 4369999)).toEqual(BigInt(150));

		/*
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Shanghai });
		expect(c.paramByBlock('pow', 'minerReward', 4370000)).toEqual(BigInt(3000000000000000000));
		expect(c.paramByBlock('pow', 'minerReward', 4369999)).toEqual(BigInt(5000000000000000000));

		const td = BigInt('1196768507891266117779');
		expect(c.paramByBlock('pow', 'minerReward', 4370000, td)).toEqual(
			BigInt(3000000000000000000),
		);
		*/
	});

	// NOTE(rgeraldes): unused: no eips available(merged)
	it.skip('EIP param access, paramByEIP()', () => {
		const c = new Common({ chain: Chain.Mainnet });

		expect(c.paramByEIP('gasPrices', 'notexistingvalue', 2537)).toBeUndefined();

		const UNSUPPORTED_EIP = 1000000;
		expect(() => {
			c.paramByEIP('gasPrices', 'Bls12381G1AddGas', UNSUPPORTED_EIP);
		}).toThrow('not supported');

		expect(() => {
			c.paramByEIP('notExistingTopic', 'Bls12381G1AddGas', 2537);
		}).toThrow('not defined');

		expect(c.paramByEIP('gasPrices', 'Bls12381G1AddGas', 2537)).toEqual(BigInt(600));
	});
});
