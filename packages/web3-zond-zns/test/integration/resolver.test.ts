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

/* eslint-disable @typescript-eslint/no-unused-vars */
import Web3Zond from '@theqrl/web3-zond';
import { Contract, PayableTxOptions } from '@theqrl/web3-zond-contract';
import { hexToAddress, sha3 } from '@theqrl/web3-utils';

import { Address, Bytes, DEFAULT_RETURN_FORMAT } from '@theqrl/web3-types';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IpcProvider } from '@theqrl/web3-providers-ipc';
import { ZNS } from '../../src';
import { namehash } from '../../src/utils';

import {
	closeOpenConnection,
	getSystemTestAccounts,
	getSystemTestProvider,
	getSystemTestProviderUrl,
	isIpc,
	isSocket,
	isWs,
	itIf,
} from '../fixtures/system_tests_utils';

import { ZNSRegistryAbi } from '../fixtures/zns/abi/ZNSRegistry';
import { PublicResolverAbi } from '../fixtures/zns/abi/PublicResolver';
import { NameWrapperAbi } from '../fixtures/zns/abi/NameWrapper';
import { ZNSRegistryBytecode } from '../fixtures/zns/bytecode/ZNSRegistryBytecode';
import { NameWrapperBytecode } from '../fixtures/zns/bytecode/NameWrapperBytecode';
import { PublicResolverBytecode } from '../fixtures/zns/bytecode/PublicResolverBytecode';

describe('zns', () => {
	let registry: Contract<typeof ZNSRegistryAbi>;
	let resolver: Contract<typeof PublicResolverAbi>;
	let nameWrapper: Contract<typeof NameWrapperAbi>;

	let Resolver: Contract<typeof PublicResolverAbi>;

	let sendOptions: PayableTxOptions;

	const domain = 'test';
	const domainNode = namehash(domain);
	const node = namehash('resolver');
	const label = sha3('resolver') as string;

	let web3Zond: Web3Zond;

	let accounts: string[];
	let zns: ZNS;
	let defaultAccount: string;
	let accountOne: string;

	const ZERO_NODE: Bytes = '0x0000000000000000000000000000000000000000000000000000000000000000';
	const addressOne: Address = 'Z0000000000000000000000000000000000000001';

	const contentHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

	const DEFAULT_COIN_TYPE = 60;

	beforeAll(async () => {
		accounts = await getSystemTestAccounts();

		[defaultAccount, accountOne] = accounts;

		sendOptions = { from: defaultAccount, gas: '10000000' };

		const Registry = new Contract(ZNSRegistryAbi, undefined, {
			provider: getSystemTestProvider(),
		});

		const NameWrapper = new Contract(NameWrapperAbi, undefined, {
			provider: getSystemTestProvider(),
		});

		Resolver = new Contract(PublicResolverAbi, undefined, {
			provider: getSystemTestProvider(),
		});

		registry = await Registry.deploy({ data: ZNSRegistryBytecode }).send(sendOptions);

		nameWrapper = await NameWrapper.deploy({ data: NameWrapperBytecode }).send(sendOptions);

		resolver = await Resolver.deploy({
			data: PublicResolverBytecode,
			arguments: [
				registry.options.address as string,
				nameWrapper.options.address as string,
				accountOne,
				defaultAccount,
			],
		}).send(sendOptions);

		await registry.methods.setSubnodeOwner(ZERO_NODE, label, defaultAccount).send(sendOptions);
		await registry.methods
			.setResolver(node, resolver.options.address as string)
			.send(sendOptions);
		await resolver.methods.setAddr(node, addressOne).send(sendOptions);

		await registry.methods
			.setSubnodeOwner(ZERO_NODE, sha3(domain) as string, defaultAccount)
			.send(sendOptions);

		const clientUrl = getSystemTestProviderUrl();
		let provider;
		if (isIpc) provider = new IpcProvider(clientUrl);
		else if (isWs) provider = new ZNS.providers.WebsocketProvider(clientUrl);
		else provider = new ZNS.providers.HttpProvider(clientUrl);

		zns = new ZNS(registry.options.address, provider);

		web3Zond = new Web3Zond(provider);
		const block = await web3Zond.getBlock('latest', false, DEFAULT_RETURN_FORMAT);
		const gas = block.gasLimit.toString();

		// Increase gas for contract calls
		sendOptions = {
			...sendOptions,
			gas,
		};
	});

	afterAll(async () => {
		if (isSocket) {
			await closeOpenConnection(zns);
			// @ts-expect-error @typescript-eslint/ban-ts-comment
			await closeOpenConnection(zns?._registry?.contract);
			await closeOpenConnection(registry);
			await closeOpenConnection(resolver);
			await closeOpenConnection(nameWrapper);
		}
	});
	beforeEach(async () => {
		// set up subnode
		await registry.methods
			.setSubnodeOwner(ZERO_NODE, sha3('eth') as string, defaultAccount)
			.send(sendOptions);
	});

	it('supports known interfaces', async () => {
		await expect(zns.supportsInterface('resolver', '0x3b3b57de')).resolves.toBeTruthy(); // IAddrResolver
		await expect(zns.supportsInterface('resolver', '0xf1cb7e06')).resolves.toBeTruthy(); // IAddressResolver
		await expect(zns.supportsInterface('resolver', '0x691f3431')).resolves.toBeTruthy(); // INameResolver
		await expect(zns.supportsInterface('resolver', '0x2203ab56')).resolves.toBeTruthy(); // IABIResolver
		await expect(zns.supportsInterface('resolver', '0xc8690233')).resolves.toBeTruthy(); // IPubkeyResolver
		await expect(zns.supportsInterface('resolver', '0x59d1d43c')).resolves.toBeTruthy(); // ITextResolver
		await expect(zns.supportsInterface('resolver', '0xbc1c58d1')).resolves.toBeTruthy(); // IContentHashResolver
		await expect(zns.supportsInterface('resolver', '0xa8fa5682')).resolves.toBeTruthy(); // IDNSRecordResolver
		await expect(zns.supportsInterface('resolver', '0x5c98042b')).resolves.toBeTruthy(); // IDNSZoneResolver
		await expect(zns.supportsInterface('resolver', '0x01ffc9a7')).resolves.toBeTruthy(); // IInterfaceResolver
	});

	it('does not support a random interface', async () => {
		await expect(zns.supportsInterface('resolver', '0x3b3b57df')).resolves.toBeFalsy();
	});

	it('fetch pubkey', async () => {
		await registry.methods
			.setResolver(domainNode, resolver.options.address as string)
			.send(sendOptions);

		const res = await zns.getPubkey(domain);
		expect(res.x).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
		expect(res.y).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
	});

	it('permits setting public key by owner', async () => {
		const x = '0x1000000000000000000000000000000000000000000000000000000000000000';
		const y = '0x2000000000000000000000000000000000000000000000000000000000000000';

		await resolver.methods.setPubkey(domainNode, x, y).send(sendOptions);

		const result = await zns.getPubkey(domain);

		expect(result[0]).toBe(x);
		expect(result[1]).toBe(y);
	});

	it('sets contenthash', async () => {
		await resolver.methods.setContenthash(domainNode, contentHash).send(sendOptions);

		const res = await resolver.methods.contenthash(domainNode).call(sendOptions);
		expect(res).toBe(contentHash);
	});

	// eslint-disable-next-line jest/expect-expect
	itIf(isSocket)('ContenthashChanged event', async () => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
		await new Promise<void>(async resolve => {
			const resolver2 = await zns.getResolver('resolver');
			const event = resolver2.events.ContenthashChanged();

			event.on('data', () => {
				resolve();
			});
			await resolver.methods.setContenthash(domainNode, contentHash).send(sendOptions);
		});
	});

	it('fetches contenthash', async () => {
		await resolver.methods.setContenthash(domainNode, contentHash).call(sendOptions);

		const res = await zns.getContenthash(domain);
		expect(res).toBe(contentHash);
	});

	it('sets address', async () => {
		await registry.methods
			.setResolver(domainNode, resolver.options.address as string)
			.send(sendOptions);

		await resolver.methods.setAddr(domainNode, accounts[1]).send(sendOptions);

		// NOTE(rgeraldes24): resolver.methods.addr(node, coin) return type is 'bytes';
		// value is not converted automatically to the 'address' type via ABI
		const res = await resolver.methods.addr(domainNode, DEFAULT_COIN_TYPE).call(sendOptions);
		expect(hexToAddress(res.toString())).toBe(accounts[1]);
	});

	it('fetches address', async () => {
		await registry.methods
			.setResolver(domainNode, resolver.options.address as string)
			.send(sendOptions);

		await resolver.methods.setAddr(domainNode, accountOne).send(sendOptions);

		// NOTE(rgeraldes24): zns.getAddress(domain) return type is 'bytes';
		// value is not converted automatically to the 'address' type via ABI
		const resultAddress = await zns.getAddress(domain);
		expect(hexToAddress(resultAddress.toString())).toBe(accountOne);
	});
});
