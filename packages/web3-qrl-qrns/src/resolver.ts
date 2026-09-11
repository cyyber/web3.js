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

import { ResolverMethodMissingError } from '@theqrl/web3-errors';
import { Contract } from '@theqrl/web3-qrl-contract';
import { Address, PayableCallOptions } from '@theqrl/web3-types';
import { isNullish, sha3 } from '@theqrl/web3-utils';
import { isHexStrict } from '@theqrl/web3-validator';
import { PublicResolverAbi } from './abi/qrns/PublicResolver.js';
import { interfaceIds, methodsInInterface } from './config.js';
import { Registry } from './registry.js';
import { namehash } from './utils.js';

//  Default public resolver
//  https://github.com/ensdomains/resolvers/blob/master/contracts/PublicResolver.sol

export class Resolver {
	private readonly registry: Registry;

	public constructor(registry: Registry) {
		this.registry = registry;
	}

	private async getResolverContractAdapter(QRNSName: string) {
		//  TODO : (Future 4.1.0 TDB) cache resolver contract if frequently queried same QRNS name, refresh cache based on TTL and usage, also limit cache size, optional cache with a flag
		return this.registry.getResolver(QRNSName);
	}

	//  https://eips.ethereum.org/EIPS/eip-165
	// eslint-disable-next-line class-methods-use-this
	public async checkInterfaceSupport(
		resolverContract: Contract<typeof PublicResolverAbi>,
		methodName: string,
	) {
		if (isNullish(interfaceIds[methodName]))
			throw new ResolverMethodMissingError(
				resolverContract.options.address ?? '',
				methodName,
			);

		const supported = await resolverContract.methods
			.supportsInterface(interfaceIds[methodName])
			.call();

		if (!supported)
			throw new ResolverMethodMissingError(
				resolverContract.options.address ?? '',
				methodName,
			);
	}

	public async supportsInterface(QRNSName: string, interfaceId: string) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);

		let interfaceIdParam = interfaceId;

		if (!isHexStrict(interfaceIdParam)) {
			interfaceIdParam = sha3(interfaceId) ?? '';

			if (interfaceId === '') throw new Error('Invalid interface Id');

			interfaceIdParam = interfaceIdParam.slice(0, 10);
		}

		return resolverContract.methods.supportsInterface(interfaceIdParam).call();
	}

	// eslint-disable-next-line @typescript-eslint/no-inferrable-types
	public async getAddress(QRNSName: string, coinType: number = 60) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);

		await this.checkInterfaceSupport(resolverContract, methodsInInterface.addr);

		return resolverContract.methods.addr(namehash(QRNSName), coinType).call();
	}

	public async getPubkey(QRNSName: string) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);

		await this.checkInterfaceSupport(resolverContract, methodsInInterface.pubkey);

		return resolverContract.methods.pubkey(namehash(QRNSName)).call();
	}

	public async setPubkey(
		QRNSName: string,
		publicKey: string,
		descriptor: string,
		txConfig: PayableCallOptions,
	) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);
		await this.checkInterfaceSupport(resolverContract, methodsInInterface.setPubkey);

		return resolverContract.methods
			.setPubkey(namehash(QRNSName), publicKey, descriptor)
			.send(txConfig);
	}

	public async getContenthash(QRNSName: string) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);

		await this.checkInterfaceSupport(resolverContract, methodsInInterface.contenthash);

		return resolverContract.methods.contenthash(namehash(QRNSName)).call();
	}

	public async setAddress(QRNSName: string, address: Address, txConfig: PayableCallOptions) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);
		await this.checkInterfaceSupport(resolverContract, methodsInInterface.setAddr);

		return resolverContract.methods.setAddr(namehash(QRNSName), address).send(txConfig);
	}

	public async getText(QRNSName: string, key: string) {
		const resolverContract = await this.getResolverContractAdapter(QRNSName);
		await this.checkInterfaceSupport(resolverContract, methodsInInterface.text);

		return resolverContract.methods.text(namehash(QRNSName), key).call();
	}

	public async getName(address: string, checkInterfaceSupport = true) {
		const reverseName = `${address.toLowerCase().substring(1)}.addr.reverse`;

		const resolverContract = await this.getResolverContractAdapter(reverseName);

		if (checkInterfaceSupport)
			await this.checkInterfaceSupport(resolverContract, methodsInInterface.name);

		return resolverContract.methods.name(namehash(reverseName)).call();
	}
}
