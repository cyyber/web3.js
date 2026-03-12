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
import { RLP } from '@ethereumjs/rlp';
import { hexToBytes } from '@theqrl/web3-utils';
import { Chain, Common, Hardfork } from '../../../src/common';

import { FeeMarketEIP1559Transaction } from '../../../src';

import testdata from '../../fixtures/json/eip1559.json';
import { newMLDSA87Descriptor } from '@theqrl/wallet.js';

const common = new Common({
	chain: 1,
	hardfork: Hardfork.Zond,
});
// @ts-expect-error set private property
common._chainParams.chainId = 4;
const TWO_POW256 = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000');

const validAddress = hexToBytes('01'.repeat(20));
const validSlot = hexToBytes('01'.repeat(32));
const chainId = BigInt(4);

describe('[FeeMarketEIP1559Transaction]', () => {
	it('cannot input decimal or negative values %s', () => {
		const values = [
			'maxFeePerGas',
			'maxPriorityFeePerGas',
			'chainId',
			'nonce',
			'gasLimit',
			'value',
			'descriptor',
			'extraParams',
			'signature',
			'publicKey',
		];
		const cases = [
			10.1,
			'10.1',
			'0xaa.1',
			-10.1,
			-1,
			BigInt(-10),
			'-100',
			'-10.1',
			'-0xaa',
			Infinity,
			-Infinity,
			NaN,
			{},
			true,
			false,
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			() => {},
			Number.MAX_SAFE_INTEGER + 1,
		];
		for (const value of values) {
			const txData: any = {};
			for (const testCase of cases) {
				if (
					value === 'chainId' &&
					((typeof testCase === 'number' && Number.isNaN(testCase)) || testCase === false)
				) {
					continue;
				}
				txData[value] = testCase;
				expect(() => {
					FeeMarketEIP1559Transaction.fromTxData(txData);
				}).toThrow();
			}
		}
	});

	it('getUpfrontCost()', () => {
		const tx = FeeMarketEIP1559Transaction.fromTxData(
			{
				maxFeePerGas: 10,
				maxPriorityFeePerGas: 8,
				gasLimit: 100,
				value: 6,
			},
			{ common },
		);
		expect(tx.getUpfrontCost()).toEqual(BigInt(806));
		let baseFee = BigInt(0);
		expect(tx.getUpfrontCost(baseFee)).toEqual(BigInt(806));
		baseFee = BigInt(4);
		expect(tx.getUpfrontCost(baseFee)).toEqual(BigInt(1006));
	});

	it('sign()', () => {
		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let index = 0; index < testdata.length; index += 1) {
			const data = testdata[index];
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			const seed = hexToBytes(data.seed.slice(2));
			const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common });
			const signed = txn.sign(seed);
			const rlpSerialized = RLP.encode(Uint8Array.from(signed.serialize()));
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			expect(rlpSerialized).toEqual(hexToBytes(data.signedTransactionRLP.slice(2)));
		}
	});

	it('hash()', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		let txn = FeeMarketEIP1559Transaction.fromTxData(data, { common });
		let signed = txn.sign(seed);
		const expectedHash = hexToBytes(
			'0x9ba79d169e993453d083fd3cf48b9fcf9c4d031be42aed0a89c5a57ecb211b0d',
		);
		expect(signed.hash()).toEqual(expectedHash);
		txn = FeeMarketEIP1559Transaction.fromTxData(data, { common, freeze: false });
		signed = txn.sign(seed);
		expect(signed.hash()).toEqual(expectedHash);
	});

	it('freeze property propagates from unsigned tx to signed tx', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common, freeze: false });
		expect(Object.isFrozen(txn)).toBe(false);
		const signedTxn = txn.sign(seed);
		expect(Object.isFrozen(signedTxn)).toBe(false);
	});

	// NOTE(rgeraldes24): test not valid atm: no qips available
	it.skip('common propagates from the common of tx, not the common in TxOptions', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common, freeze: false });
		const newCommon = new Common({
			chain: Chain.Mainnet,
			hardfork: Hardfork.Zond,
			qips: [2537],
		});
		expect(Object.isFrozen(newCommon)).not.toEqual(common);
		Object.defineProperty(txn, 'common', {
			get() {
				return newCommon;
			},
		});
		const signedTxn = txn.sign(seed);
		expect(signedTxn.common.qips()).toContain(2537);
	});

	it('unsigned tx -> getMessageToSign()', () => {
		const unsignedTx = FeeMarketEIP1559Transaction.fromTxData(
			{
				data: hexToBytes('010200'),
				to: validAddress,
				accessList: [[validAddress, [validSlot]]],
				chainId,
			},
			{ common },
		);
		const expectedHash = hexToBytes(
			'0xd901a3a8a24477c4d032ca89da077bb710ee581f51f66d087b9732e78d66833e',
		);
		const desc = newMLDSA87Descriptor();
		const extraParams = Uint8Array.from([]);
		expect(unsignedTx.getMessageToSign(desc.toBytes(), extraParams, true)).toEqual(expectedHash);
		const expectedSerialization = hexToBytes(
			'0x02f85e04808080809401010101010101010101010101010101010101018083010200f838f7940101010101010101010101010101010101010101e1a001010101010101010101010101010101010101010101010101010101010101018301000080',
		);
		expect(unsignedTx.getMessageToSign(desc.toBytes(), extraParams, false)).toEqual(expectedSerialization);
	});

	it('toJSON()', () => {
		const data = testdata[0];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const seed = hexToBytes(data.seed.slice(2));
		const txn = FeeMarketEIP1559Transaction.fromTxData(data, { common });
		const signed = txn.sign(seed);

		const json = signed.toJSON();
		const expectedJSON = {
			chainId: '0x4',
			nonce: '0x333',
			maxPriorityFeePerGas: '0x1284d',
			maxFeePerGas: '0x1d97c',
			gasLimit: '0x8ae0',
			to: 'Q000000000000000000000000000000000000aaaa',
			value: '0x2933bc9',
			data: '0x',
			accessList: [],
			descriptor: '0x010000',
			extraParams: undefined,
			signature:
				'0x398ce9d7a0dd6f39bee2d35a0e3969d0661e9b46734e8f83d95a1dffc2495a91864cc2e7837faa977b880508be7adb974e575066412d3692907d40645e2309e75dac1d6f327f82a04e49e6913dd09fb7a84caa213b8ff3db74507f775930f4286208b43dc1cc71a45e7f4b6a8ddc056e3956e03b2f135ee4e20ce5efd0bf5b451a1773c216e6251bbc775efdad3038939e9d7059d280166acd235584f4830beadfed8dd41bb5e4ca28855b6f369f3661a45393d4f4f93a957b6324fbdf9f9c11ec267200e59b8bf394f054e714fefee60b86e0be12d79264bbd2467d604ba714c13c90eb60240638e142ddcfa739f137829e00d39222b781ecbae14096450c756ec58f03c79a19000f6a227675bef9bfa83ecd6f9fb382dedb66dc130de4cc7d955dce97398a26173d5d8a5f24b6fd8b65fafbf5d8a48f2a7f945cf0d3185892343aa9db2eb590f9ba9d3afdf9aecc2cd642b57cf50d9cffb040842aba6767c9c57236d1920ae0888b3fb5b2441cf71e14233e6124666f455f4cb7fad0bede06c131bf2ab277b3bddead80330ed38ceba9dabe69ddbee703a3b763044464d1c04797e3a6c27e99b6d10302dd8c2bbf6ae915e2a1846b33be28313b3a63a6322bd7fe345a93ff526d34ef8622157a2f552217f21c0a84e6e1d5a8b153d73acf77422c82eed49a2f7029c7fe802133ba8aa0fe2eebb9dbff30ff292a1bb0852f73248d3e120db522b865b8770ec185187a68ecc9453cd2494d303cb1cba9b89f1f6b66c47efaab1ab6c8e5bec55208715c143e0b24a33607e5164127f3dfaf8b1933da9f286e86c65aff6df21dbda5063d21c98babd1ce0b5988ed65f328bc6b605a82ab5b440502cfb93b497b0632bf15c8d982e4db1688cfeacef9888aa4070da93737e0ed153f73a6660179206ffdfaf70cf37b6c8fbf0618ec0868d6e97d3c5a7053bea0090e7f8e6f33a220a2f0bdcd449e8f70d68151549c39b3bfb6342ece62fa45a9152fc717a98b4a5f68ff63a866737de80889c8038949665b1b1377cabfb646cb7452fb8820395d388e41736d97262fdd047bedf6e069a3a41c8fe4981846815e06cf4781136367351e259bc655f9f96465628ed5f3367f0366dc58b5bdbcfa4e0b2371c0208a7283b3861c6aae5d5a2b6e45b1af780e7aaf266cafaacf2b0a36416b3f2f9bdde11d3508421fccc9f2ed1f67807e32d3eed8cc41adfc08691165d477d37a06a11ef3c76323ed47d6880d1863a895a77472cc87ec981e640a6e469f11d78a79822639f9618bb77986e6cd93808ad8ba80326a9a86f8b395bead73572c86ff96280926deedc700c8129a521377da080b605e417a909e709227e4e0bd3d2365f95b1917c919c5dde739d7dd465e35f4998e6cc978597bb3b18ccf28cde8d211c5dd805bc59fc07a6997bbfcba48584593700cda965a049390f4d31c86a160d21e4b30238d77bd19488a434079a7047fb43f77d4b04b004fcee9741f3198f0bca47045f8be02eea8e0cca1bb54068fc2b840c26afb1aedd54de6255f1e390545e845873f34b1661b1e4b1122d97ce1d4a2ee658969cc833617dcc28433893dda979155870bd0d46aff8ee5f32bd3b91f85afd6b85781c4439ab6fec51f4ea5ded2709866e0dc3c3d72b070c5a46d4e099fe624557c6d9b2955583f9b4edaad3fc299a3f3693abf1ea6fdc60985dc5242de5791172bd63dcd9698d9102f9aba4e9ffbad74954cc65f8873699dd72f32380d2c44466f3d6803484734d9981c9d76ae53b84e3b5a0c351385000f272cdb915fe673342f9fedb3dbb1347bf1c086224cfb1abcaf7ea65b1d478269335cdc5b0efdba2d8265c3853f17efea5cd1c2b390001b84429bc73525c97d50dff71f6b364004af08ff17fd9df25d6a1694153aad69fb5cb0ff2fbf833f876ffc9aa7db72b6a4093ec26be80d75173eb1e43b5bff1d7dc13564515da215ff433960b8e3c406d35de631bac7e156fec205c623a7a3b30d14a0f4cae7ca1e10f1885b7837407ecf67b38caea6b3a76724abf0f3763d7e0e88fa7d51f5807da4fe204b7072b9c7fef43565c4d09b17cd3bdc0f546daeed24a213e94dc12101f569ccb36fd62b7972d7aa499b7f1472c52bc7a7d01cefdea6b9e5ac0a56e8a85ed1a1900d2bc25dcf490c0b0d9637639bd855af7ee99ee59001dea32ab18dbf3dc7f2a14be35239f775e535a58d8b060163b051527b873ca39f0aa7b4a5a82439edcad84189c16add182a1921c94b3f49019b20edd413b98e2a587b44d1bdcf341bd6eff7fcdb3fbc7b3bf5d812956b3d658c2413e35830d7c8972931767d0182ce72d993e9bcb1a954927a6a3d34c0fecef89a19e3d1fe19738d98a06b5e89d6e657b033e6fdb1e3eed34ed114d4e8f0094dfb51a49c6ab63eebf88978b388e516ba90210c8ad5c170fef2577fc66b717a2c1c3719f34b96060702c3356b5eadef1afd0aceb6ae79c01fd9cba880b0962ab52d8483a7be4a3999c89735a02097e0c49e4895947a461bee9e0aa34b0b66f43e20682f7ecd227aec8f658a2778f5d1fc378cb0c12a6cee3edf1cd3d3dab4924d8b9787f12b92a2780c00272cd5edc8111dada9652d6b194864750e8d5b4866292bbad5bbead34c3bea328ac7665363c1c5b4df726ac8859b44dccad91de470e19805cbaebee3dd5384f6e9d689dc063accbf0869ba0c0cd68d918109562013a8e107f41fc23365744d2322c3990585ff77f2e8fbe1c7ed1e5a367179c98bbe2e3e8344156b83b4d83a1b16fbafdeb2753b4490be73bc9757a96b7abbcf28711e7d8a815299a5bd140c3760ed31b8b5c93cb6e5c6715721c834464304b261876391ceeb6553b82017890ec33d07512c5705431b89adb0a7629a61e9748a38ae7b6b4b11e4306b359bf0cd7b61c716e4ad95431991ebf8d6d5f6907fa47e9bede3f94a25c0a030d7e610d06a9ff2d515037655dfde19de455466ccd308493381c9cc24e914facc82af5580686bebafdc4aa93a25dcb47dea2d4ce84af63e428c55c852b57bcddd3b10dcd3d703056d4c56deb06d9a78455586240ad844356c4520f3ae4f7f4c81699dd21847646d196ced724ea6e6da5053f1cd3b51e7e114a8db032025c63655cb87c923d38bb39e99475b7564d2d187fc684c7d7f27099897111dec0131beaf44cf6d468278275b9a3fab1b787341d75fffeb99545b50ff7daff616abcba983893758b902b29f554120b1342832d1fcdb8e4816fb35dabf14fbb044c0f13eda12c5e219ea381d0329b17469b091a86f365ae40cadd776b404aa7e3a6c8b0d395be8199cc2acc9bb3b67c31b02fc2b3fecd11e14bacab2d42234330fd60db0461c8bb1fe7eaccd8bc0daaeca7d95c836b77cfcc281da050b7680b4e97ab522edc5c7b092343d1f529e7e67d9d79954858a751433eefabf0088e694b0b323964256fabd1cc66144b3169dda7eafcb5ddf2cc39f40db820aead50d9a87e6a38e90e42f1bf088d8019ade63e155590e4e7f762068404eb712fd6af3d09ea583f5be1824c57c72073b3c97eca5401ed23f8e1f93a3daaf379bde7f245e7993624d9f6f70f803c4918f93beca2f2dd01c929cbd91a1660f45cc5fb151fa70e6749d67018ed13140f7856ff27f8ed085b27dacc2a1e017071f9d1fe00b900ef3ff0f7336c9d163126dd311d1824620c33e069bcf409362a2d5fbbc77713144e0df2c4000e6b64c13bdae6c6396d1310e6e4206464dec119bdd4c267c3de5488f609538981b01e91e1b916b5e455f3f4652e750dcb343581f462f91196e19b56ab380d1400c19c46083bb5a6aacfb8104dc8e77cb697ab55cfddc48f2673dcd593ecab7159dbd56fbfb8683dc1c05fa6f6d09272a23d3567f634e389cc48d1471415fdea38cbc807e20280464e518782ed63b8578ba9532ae15b21d90afb4a804448c957c63c6cfd21f1bdd6ebb1d7c9a9303976296ff43a37ce31a1d55fb0ebf9e17c168e639ae92b4cf285180b87dcd4aac112a71817cec7961c73c5696d0bdd37642dc4bd0ed8a7d5ec56f186c62360ee83dfbd8cddb515599559bc235e7affa9d6f7e2eeaa25df2a4072cea06a1a115852c3680788351b7c0aebb4addf5d69a2ec2574ef8fbbaa4d20e02a35764dff647c26da7fe10e21f679110bb0737ba871ba7e2638096751e1f5f08d4e3ec1ea42e3ba783d876d41cc0d7474fbce062a8e7f03025f4178cd65c6c260bc6f27868f9465761295c373373a50bc98482ff906b0d816a14b0294946441b95d5534e85c1bb1870f0382aaaeb4e2dcf8b4756b47963ae34d21f74f1120c51b7ac4e9641314da230b220050901e14cc14794c8798ff7d33da5f0e3e326ee7ed367a8cdfefc5d5ae5db28b2635386591c242340c60fb4a1e08c5431054b7610d730db217ed0c4b64006b213f59f91f7afba0e1a2fbb357b646af25f276994bf971fc7655588d5f8e633bb9bb6156f7669f995f6e513505bbe443486909cce39da35e3f33d3c078af5ef521e409479593e01966ffc2f5ede6c8debe5cd26fbab0be7efcf643ffdbc69bd7639373ca78a1e9b283ce97089597aadbc53a08467903374cec663a2a734737bc456740191a2c272d850b44c31ded486dd36da086748485c791226e9cf343e3dd3d7848590a4bbde8705f5b4c06e3681b58426bef2b0f6ff445a2c0ca64f999cd7b9f46cb685e09630c950935452e9ecc34803f461e8a7b9d156086c52c0890ad5eed23bc388061bab9610bd34ff7212bf780c43b38ec63d0a9ab58ea5ebba4c843a73b69bec12840273783d78e9c96ddd2d558cbe49b98a4af9ec48153221b3120aecca14b360a599ab2f36f6e04e033af4f9bf10f80f468dbf3f66b2985c8e2603352eaeabc5a3151aa7f4b4a882005d37615f56448eae85a4f8ad8bc97df9b79abf5c170ba03a2d42c2f3a3ff827a7f30a1031e456cdc43cd2847163d43483938a80865ea102d46b1fb1f7e9915228783aaf2e9b236e6c3dd17946c68d23cbe2bb40d5d30c809316dea93faeb67fdf4e212ec6aad1e6760b440e87b6b6826caa4ee9831dc711a2260170daaaba39c944d84ece10e41f9f64f494816b74c1222b1873365e7e374d2cd574e94dc45957fa2f41bee59b47a1987d26375b08f074c8682464f8dad7a3c79d1fe4e627e4acd10f571f3b7999c0c81f71e1302deca39bfbae824ed3287c47dfc51ca7877966450c1f05b9db6623e669eb3899c5debe26609c271ad213d98902c63971a110351d4890fc1960209dadfbfafcae7b0139282da2bf0e71c34b8d9f4b44840b803c4b938416e75463a8e1c13dd5ba9a8cee1e359e1586c4123fb62dc6d54c397f8536fb5a0c0ede0c17ddc49c1f0fd9f6cef0980f13e347e82af8c8ef0c8c964deaefb6a97b2f5abf3a5b88f3faa167d119b7eb441f025434e55662d24efcfb6b385cbac62d3fa4aa633e90ef36e65eadb096513e08a18dd0606a2412b8de4ba0a7873526d3515ac76d5495134eb297170c29146016a0cb343fdf9857154ab969226891c38a42b0b6827613a66539306f6e49e7af49c7e6815999e70b608aa45f6a51f6016bb0d73cd79b0f2ba47eedf07a452b0a7df524bacb2f715054e86dd6f30fa2f3765e98e785c0051a2299a3b0d53905de1c83e0b260f06e9c73d5a0667ef65a12ecf2d1c2c3014a78fced450b4537f18aee256f359125d53fdec77e44d950044bf89166cce8ab0dbf761785e1d2a0789dadb1fb15b1514567a6dadd42024f1bb735ab02e77b55bf711d185fe03a49d4450944ddf6b2f05b250f95289fe352bb16f4cefc03cd4413bfb886871064631a470f919382406e0349ca8e5a9d399cff01a4ed9c1137bd35a7e99911869a6e266cea03e6767b3667e403c712e8690a8241311e18e40cc52c293c3d97234d202ae4170d52fa8ed3eca7d53fa7a786bb62fba64d16112d82f88608d7b75e2f3e20afbb81d09a8619da3b60cdd8cbde71d8bbf8505363d36fc1608e54e85549ebace896d7c76147dea34ca52c0a929b0a7a4f66086c05d23ab39a695a6e3b20285acd4f67fc3e07fec8d0d3fe4fb6c0027bc4f457c54e474a18cd079db4a81ba858cda1190dddd16d097327aca53b3b43d41d946a9c4e1856532246153fe50e18e9c3e6c99e204b26f01a7b29222f344cbd600bbdcc3ed2ae317ddf2b3c6e5554294890db18a1f88afe3c3c5ff54eb90730d3c0403da4904aea776c587ddad99ef39eb880c39f3fd4909866cac21776aafeb9ee8b9562cec0300bbabcaf30b7a0e4d03354da4dbb41ebb6ebaa68f45828951c23d56642fa784ef1539558975d0c1e334c4419a5a943785769137ff0a74d3c8c768af9eba94373f7519abd4c437534531388a98165ecc411939360c74791a854655d355529ef29f5f94533459201e2e6f7b7cb4bd0e5f9aa5b6e5131e7db2d61e356389a1cb05297f80abd25b7a95b1b6d0d60a3f4549748b949ec61221767988a5cdd5000000000000000000000000000000000000000000070d12181e252e36',
			publicKey:
				'0x71a7f60efdd1db34fe06b952141348ee175dde117f85dbd3b101102352b8f2493ef8eacc112acf27790f1d6efb1aa0b60a5345b2cdd155d3973678e0b037d404bfa3c4e77964f3fc050c071c9cc13530616dc2ff9a571644b1a53b78acc88aca1c9dc3d370585f2d2a0be9e38551a92590eba009639e566e2ec33965401d07a0a1ffbe373cd9a22e203bd538ebb670c06c33f2349d94b5c34a54454bdbc6bb7fca9ea3d2d04216ccb35456016c79f21e95e3d3e7e7368f03abf5f19369b94892c7144829f3130e8fd2c9fb691c3b7802f9fa01a5620a9d54fbea791669305b0d2b05f6d604d0569b2f90caf4280f3a0f9ec93fcd0da626527b68543bb69a8a48cca9d4f8a506eb38ad30382b31e5a3374654a63ba38dcaf634fb1b67fe487ec16fa1919f257d28aedbc476db3a1695a0e505c7e70b3ef350d6eaa51062b21771dec52e68082e2b6a378331c5eafbc1e11812f76e2231308844bf26bf8b2a9c379353a7452366d681d71c8ccf84f6f0ff284f7c783193c535965d1e43781ae8491754b52eb78db4939ff13f9c67f501d0e263d5ba1bea74ec2aab7a2b210127a1408b9a9f2ab46fe057f6148df2813f2f759d5207e385991f3e0b9cf71b1a518ac2146ecb5856695a3cfb7199456aaf366ab6c7de30fbc534633cc9ae738ac19e2035bd201966412f1a079dcc00d656bf39e798013a26bbe5ac9cebd71aae628eeb2f013ce9181d65c7cc6980aafb3c27fd7dfa8b3959e6f86c572cac181fa70a9178f206201e6a31e072e8d1ee124aa3ae720455b1b9b370e8179a3ddf14b56a9e1d378ce9060f326784f305dacf2a824597f448f239efecfac889e46e1f5ce9e2901b57d4aeeab08fdf31e4d178949ad7fb0eba42319ecb7d99eeee44b8647fddcbe41f3ea2e417cf57cba84eb88e4c291300fbf2bc4dc2bdb79759ef764f8eeefe5661bedaec67bdccdf046cdeb9dd80004e4e3e1005716e89ed2f3881009e602a5d6fd8793e0134a4b807797490b9f2fe66d9ddc40438e8a9810d601677307eb328496a9242173359288bf90f1157e77acedc8ce2d0186a5f9cc4ad79368dd59b67a05442a3478be5f8afe5afd15b5d2b7d947afb01fdf9249d3149ecb998d1ecec12e39969a6d57715043b66c09d447c3dda6ee6dda5838dd701c2bb6fa352e46b68fcbb5ec2a5a1c079fce91d34e0321571a1c02431d240a054d050fded8a2b3f53301ec16ff7cbc994ee320803e5e72d7d4ce7566be875fcc78b8bb31b78203ba056b8f50c6ac24afae4b2666158cc1aa370b19c47d90bf769d094ba9c715efe14a18e7c08498c0f402d3b5f5c324616c4b60b27167f94050e5a260cab7170d1a9ef29f6adb066f8f6a16e6837dbd9a7f54c3bed07c4b8482a5b8d22fa8ee54ec6b59dab39df7a59671a1fd26c9f633efa6217fa4b6364180bc64bbb68c7f38e0bff57fc2ada98eaa73fd103fb57c15d307d4e08ad94825cbc1c1e96d00cd0d5b61e989e3c8c94a65a6d8c36d07c5dc841cca9d12fc0df3723403fba0f15ccfa31ff02d62079e8f62c93d4b9782cba357f368b0405b2fa96e140b25d6aedd17c199f3542604f22df8bb9d6c9693c2677b3cbbb9a9fe23af1d2a5c0083734115445dbfdf67afc1979e2f1908e07bc72280ef2631f8825dd59638566508737abd709bbd53356e8cc877716ed4691ec289a9380d401353117b828daa1ec2e67800d37e277c469fc9643d9c5ce28edde8e7191a085cd368196d38941eacddf923af99213c0fdb0c5f2d90e16fdbff0e35bd7069a0ae46d1d4433b4a565ecc51b0f257120116080b77911e3530368ff0d7548e8bf9f2297850c3f5f235f81590e975cfac92e6cf84a540f65902f5c651d3f7cd484b33bbd379b4f2581f7225fc7285c7fa3801d4ea3e623fd2b82e48d78bb20db1f13b75383743a72685901944137498b3e12e13707538f54341ebe5cbe4419aa885b41d3320938e0086deed3c2c57805f6c83be4b5c2d8fec72a476f8948e7cec28bbcd6510bf0c94ff3cf3cdc30a059c2815e5df4dad1e2ab9d7c3f71286b188d1e11224a2de99df1f5d9cd6220163fe2f28b8439038c53ccda938425e76d95bf7609b41e766416e0e707bc13c1372f477c7818204a66aa659ac280f1e66e8d164017c1d04cbac2de757ffb3d3551ed6117e345c0a30cac34642ce5b682497920186c0327e87ee980eebd5fb25ae8e3d1543d02218b51c80224e2ba1c97f2fc003fea1cf4a4682cbe75dc3eaec932e510d83a9f1e62ca72455b60dbc301fade0f20fdd5d2ce32bee28cc4de1e267b8137e1206cd8cf6005f8169c95b454f2eefbb039f813e7ea0c909bc1795582d5c3d511ea4ab7d62e15ebfe90f861ef1274f256e8ee601cc97aabd453f440c72c81b0e7c8d39bde01fd193d234c7c2bf558a07ac0d193be8d315e4c1c13312bbd3e868bbbe2b38bff2ccdcef8c099b0a3b2fbcc17ce5d1806796247205e22ebadafd237ba14de17b2db83870827526fe3aa49deb602ebde622b565a4d3363fc7e61815ce6c6fac07a8898e716eaba1bd0f3844ebbb6ef41bfdfad829669d46539ad8729fc51cbace5c0f5b90c7d6aa3e29a283c4c4a66580f24a0050d5d716d8ee0f8ea132004c5d4fdec2d0ffc59d8297a2fa46ab685504dc97ece15814931595d45feb1cf96c907e58cc2a6b752894db00b27ce0ac8b7741164c1b2d5af29632138cf672bbb452818e69a83d3c1dce40a5ad038e5529b15bbdd1a3a33a890b07c07160e550a09b65d2c7f4fd78a08fe81137afb57581579b07b6e137646c25bb5fa00f439236d0cbc8df982ac6aa2e49ab6ecc7fd9da423aad0e7ad60401e6cbed611172fa72d6a422df88426439f047babb7b8fe78ce864709cf4574235f4d59c6af5aba17c95ba2199a6b4cafaa8af86a2fcc3e9f179e54ecf956b58f3b90b0b88add4cc8f2ebbea272d6aec63d73b2375997d240b9d672904b020ebb7ae7f898a814b2bacaf0e3987bb303c01b13d4c31763def45940f2215af9c4a6e7558189e69480897402566064734c469385c8262436fd7ad96a7d7c9d305536baa3276777e2e10f3832808c2b2a9bf15985194428ea97c48bb9eb15950732a132043cac6d43b819e6fa4a7d402f85034867f4ad6eecbf0545eb9867888efcd25055ff8161a4dbdb69837824da5e6c35d2c32a2dce6c3459a7fada1008c424f0e075ede5ae2e928c43bd4a617c613735a18a2de088165c88265ee164cdf2b66fb0934854dbf8be9f976fa1fa96c29de1997c82455e12964db5fd5e872f8d9df48f2cf6b4965145f1f750c7f61ea0e0dc591559c08c732563c2bbd2ee0ba593a0f4ed251cba45f2469a8e75b28a2add7ccae163565d3ab140bb9214a75189186d1b450db171c201cf072a92c6e6cb8a88441b2729599ed795d4ab35c9239cb97fe7833ab173a3a0fbbf5a61fa729263b8cc08b5de7257a62b6c6d36d0551a3af8d601fa48a73578e3a5ea4040f7d97512325340fe94e46220766c8d3a10ed1738acfadc152a225fff3f6d99d5669dd4c25d9812273dcfe385068dafab7ec2196e0907539ce7cd26a0853a276bfc9a470707100f8b6e01b6359bab6abbf2aac5e86e1ba4b92e8b348b041e8f280cca6228c2a8836cb952f0408004a68170fc49',
		};
		expect(json).toEqual(expectedJSON);
	});

	it('Fee validation', () => {
		expect(() => {
			FeeMarketEIP1559Transaction.fromTxData(
				{
					maxFeePerGas: TWO_POW256 - BigInt(1),
					maxPriorityFeePerGas: 100,
					gasLimit: 1,
					value: 6,
				},
				{ common },
			);
		}).not.toThrow();
		expect(() => {
			FeeMarketEIP1559Transaction.fromTxData(
				{
					maxFeePerGas: TWO_POW256 - BigInt(1),
					maxPriorityFeePerGas: 100,
					gasLimit: 100,
					value: 6,
				},
				{ common },
			);
		}).toThrow();
		expect(() => {
			FeeMarketEIP1559Transaction.fromTxData(
				{
					maxFeePerGas: 1,
					maxPriorityFeePerGas: 2,
					gasLimit: 100,
					value: 6,
				},
				{ common },
			);
		}).toThrow();
	});
});
