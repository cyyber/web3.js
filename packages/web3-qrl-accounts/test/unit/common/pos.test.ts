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
import { Common, Hardfork } from '../../../src/common';

import * as testnetPOS from '../../fixtures/common/pos.json';
import posExecGenesis from '../../fixtures/common/pos-exec-genesis.json';

describe('[Common]: POS-from-genesis hardfork logic', () => {
	it('getHardforkByBlockNumber() stays on zond from genesis', () => {
		const customChains = [testnetPOS];
		const c = new Common({
			chain: 'testnetPOS',
			hardfork: Hardfork.Zond,
			customChains,
		});

		expect(c.getHardforkByBlockNumber(0)).toBe('zond');
		expect(c.getHardforkByBlockNumber(14)).toBe('zond');
		expect(c.getHardforkByBlockNumber(15, 5000)).toBe('zond');
		expect(c.getHardforkByBlockNumber(15, 5001)).toBe('zond');
		expect(c.getHardforkByBlockNumber(15, 4999)).toBe('zond');
		expect(c.getHardforkByBlockNumber(12, 4999)).toBe('zond');
	});

	it('setHardforkByBlockNumber() stays on zond from genesis', () => {
		const customChains = [testnetPOS];
		const c = new Common({
			chain: 'testnetPOS',
			hardfork: Hardfork.Zond,
			customChains,
		});

		expect(c.setHardforkByBlockNumber(0)).toBe('zond');
		expect(c.setHardforkByBlockNumber(14)).toBe('zond');
		expect(c.setHardforkByBlockNumber(15, 5000)).toBe('zond');
		expect(c.setHardforkByBlockNumber(15, 5001)).toBe('zond');
		expect(c.setHardforkByBlockNumber(15, 4999)).toBe('zond');
		expect(c.setHardforkByBlockNumber(12, 4999)).toBe('zond');
	});

	it('Should fail setting invalid hardfork', () => {
		const customChains = [testnetPOS];
		expect(() => {
			// eslint-disable-next-line no-new
			new Common({ chain: 'testnetPOS', hardfork: 'invalid', customChains });
		}).toThrow(`Hardfork with name invalid not supported`);
	});

	it('should resolve zond at genesis from a gqrl genesis file', async () => {
		const c = Common.fromGqrlGenesis(posExecGenesis, { chain: 'pos' });
		expect(c.getHardforkByBlockNumber(0)).toEqual(Hardfork.Zond);
		expect(c.getHardforkByBlockNumber(0, BigInt(0))).toEqual(Hardfork.Zond);
	});
});
