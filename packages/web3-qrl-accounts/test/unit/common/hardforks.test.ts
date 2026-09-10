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
import { Chain, Common, ConsensusAlgorithm, ConsensusType, Hardfork } from '../../../src/common';

describe('[Common]: Hardfork logic', () => {
	it('Hardfork access', () => {
		const supportedHardforks = [Hardfork.Zond];
		let c;

		for (const hardfork of supportedHardforks) {
			c = new Common({ chain: Chain.Mainnet, hardfork });
			expect(c.hardfork()).toEqual(hardfork);
		}
	});

	it('getHardforkByBlockNumber() / setHardforkByBlockNumber()', () => {
		const c = new Common({ chain: Chain.Mainnet });

		expect(c.getHardforkByBlockNumber(0)).toEqual(Hardfork.Zond);
		expect(c.getHardforkByBlockNumber(1149999)).toEqual(Hardfork.Zond);
		expect(c.getHardforkByBlockNumber(999999999999)).toEqual(Hardfork.Zond);

		expect(c.setHardforkByBlockNumber(0)).toEqual(Hardfork.Zond);
		expect(c.setHardforkByBlockNumber(1149999)).toEqual(Hardfork.Zond);
		expect(c.setHardforkByBlockNumber(999999999999)).toEqual(Hardfork.Zond);
	});

	it('rejects an unsupported hardfork name', () => {
		expect(() => {
			// eslint-disable-next-line no-new
			new Common({ chain: Chain.Mainnet, hardfork: 'istanbul' });
		}).toThrow('Hardfork with name istanbul not supported');

		expect(() => {
			Common.custom({ defaultHardfork: 'istanbul' });
		}).toThrow('Hardfork with name istanbul not supported');

		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Zond });
		expect(() => {
			c.setHardfork('berlin');
		}).toThrow('Hardfork with name berlin not supported');
	});

	it('hardforkBlock() / nextHardforkBlockOrTimestamp()', () => {
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Zond });
		expect(c.hardforkBlock()).toEqual(BigInt(0));
		expect(c.hardforkBlock(Hardfork.Zond)).toEqual(BigInt(0));
		expect(c.hardforkBlock('thisHardforkDoesNotExist')).toBeNull();
		expect(c.nextHardforkBlockOrTimestamp(Hardfork.Zond)).toBeNull();
	});

	it('hardforkIsActiveOnBlock() / hardforkGteHardfork()', () => {
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Zond });
		expect(c.hardforkIsActiveOnBlock(Hardfork.Zond, 0)).toBe(true);
		expect(c.hardforkIsActiveOnBlock(Hardfork.Zond, 1)).toBe(true);
		expect(c.activeOnBlock(0)).toBe(true);
		expect(c.hardforkGteHardfork(Hardfork.Zond, Hardfork.Zond)).toBe(true);
		expect(c.gteHardfork(Hardfork.Zond)).toBe(true);
	});

	it('HF consensus updates', () => {
		const c = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Zond });
		expect(c.consensusType()).toEqual(ConsensusType.ProofOfStake);
		expect(c.consensusAlgorithm()).toEqual(ConsensusAlgorithm.Casper);
		expect(c.consensusConfig()).toEqual({});
	});
});
