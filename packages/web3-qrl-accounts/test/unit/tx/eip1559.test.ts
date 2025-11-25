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
	hardfork: Hardfork.Shanghai,
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
			'publicKey',
			'signature',
			'descriptor',
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
			'0x3ebb3ddca319928727dae2ada78d1f6ce078ea17fdba92e728257ab7eadde8e8',
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
			hardfork: Hardfork.Shanghai,
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
			'0x0b23ffbd208965302cabc5422c0cdf5314b931609ba18bb97d713afec7c12e20',
		);
		const desc = newMLDSA87Descriptor();
		expect(unsignedTx.getMessageToSign(desc.toBytes(), true)).toEqual(expectedHash);
		const expectedSerialization = hexToBytes(
			'0x02f85d04808080809401010101010101010101010101010101010101018083010200f838f7940101010101010101010101010101010101010101e1a0010101010101010101010101010101010101010101010101010101010101010183010000',
		);
		expect(unsignedTx.getMessageToSign(desc.toBytes(), false)).toEqual(expectedSerialization);
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
			publicKey:
				'0x71a7f60efdd1db34fe06b952141348ee175dde117f85dbd3b101102352b8f2493ef8eacc112acf27790f1d6efb1aa0b60a5345b2cdd155d3973678e0b037d404bfa3c4e77964f3fc050c071c9cc13530616dc2ff9a571644b1a53b78acc88aca1c9dc3d370585f2d2a0be9e38551a92590eba009639e566e2ec33965401d07a0a1ffbe373cd9a22e203bd538ebb670c06c33f2349d94b5c34a54454bdbc6bb7fca9ea3d2d04216ccb35456016c79f21e95e3d3e7e7368f03abf5f19369b94892c7144829f3130e8fd2c9fb691c3b7802f9fa01a5620a9d54fbea791669305b0d2b05f6d604d0569b2f90caf4280f3a0f9ec93fcd0da626527b68543bb69a8a48cca9d4f8a506eb38ad30382b31e5a3374654a63ba38dcaf634fb1b67fe487ec16fa1919f257d28aedbc476db3a1695a0e505c7e70b3ef350d6eaa51062b21771dec52e68082e2b6a378331c5eafbc1e11812f76e2231308844bf26bf8b2a9c379353a7452366d681d71c8ccf84f6f0ff284f7c783193c535965d1e43781ae8491754b52eb78db4939ff13f9c67f501d0e263d5ba1bea74ec2aab7a2b210127a1408b9a9f2ab46fe057f6148df2813f2f759d5207e385991f3e0b9cf71b1a518ac2146ecb5856695a3cfb7199456aaf366ab6c7de30fbc534633cc9ae738ac19e2035bd201966412f1a079dcc00d656bf39e798013a26bbe5ac9cebd71aae628eeb2f013ce9181d65c7cc6980aafb3c27fd7dfa8b3959e6f86c572cac181fa70a9178f206201e6a31e072e8d1ee124aa3ae720455b1b9b370e8179a3ddf14b56a9e1d378ce9060f326784f305dacf2a824597f448f239efecfac889e46e1f5ce9e2901b57d4aeeab08fdf31e4d178949ad7fb0eba42319ecb7d99eeee44b8647fddcbe41f3ea2e417cf57cba84eb88e4c291300fbf2bc4dc2bdb79759ef764f8eeefe5661bedaec67bdccdf046cdeb9dd80004e4e3e1005716e89ed2f3881009e602a5d6fd8793e0134a4b807797490b9f2fe66d9ddc40438e8a9810d601677307eb328496a9242173359288bf90f1157e77acedc8ce2d0186a5f9cc4ad79368dd59b67a05442a3478be5f8afe5afd15b5d2b7d947afb01fdf9249d3149ecb998d1ecec12e39969a6d57715043b66c09d447c3dda6ee6dda5838dd701c2bb6fa352e46b68fcbb5ec2a5a1c079fce91d34e0321571a1c02431d240a054d050fded8a2b3f53301ec16ff7cbc994ee320803e5e72d7d4ce7566be875fcc78b8bb31b78203ba056b8f50c6ac24afae4b2666158cc1aa370b19c47d90bf769d094ba9c715efe14a18e7c08498c0f402d3b5f5c324616c4b60b27167f94050e5a260cab7170d1a9ef29f6adb066f8f6a16e6837dbd9a7f54c3bed07c4b8482a5b8d22fa8ee54ec6b59dab39df7a59671a1fd26c9f633efa6217fa4b6364180bc64bbb68c7f38e0bff57fc2ada98eaa73fd103fb57c15d307d4e08ad94825cbc1c1e96d00cd0d5b61e989e3c8c94a65a6d8c36d07c5dc841cca9d12fc0df3723403fba0f15ccfa31ff02d62079e8f62c93d4b9782cba357f368b0405b2fa96e140b25d6aedd17c199f3542604f22df8bb9d6c9693c2677b3cbbb9a9fe23af1d2a5c0083734115445dbfdf67afc1979e2f1908e07bc72280ef2631f8825dd59638566508737abd709bbd53356e8cc877716ed4691ec289a9380d401353117b828daa1ec2e67800d37e277c469fc9643d9c5ce28edde8e7191a085cd368196d38941eacddf923af99213c0fdb0c5f2d90e16fdbff0e35bd7069a0ae46d1d4433b4a565ecc51b0f257120116080b77911e3530368ff0d7548e8bf9f2297850c3f5f235f81590e975cfac92e6cf84a540f65902f5c651d3f7cd484b33bbd379b4f2581f7225fc7285c7fa3801d4ea3e623fd2b82e48d78bb20db1f13b75383743a72685901944137498b3e12e13707538f54341ebe5cbe4419aa885b41d3320938e0086deed3c2c57805f6c83be4b5c2d8fec72a476f8948e7cec28bbcd6510bf0c94ff3cf3cdc30a059c2815e5df4dad1e2ab9d7c3f71286b188d1e11224a2de99df1f5d9cd6220163fe2f28b8439038c53ccda938425e76d95bf7609b41e766416e0e707bc13c1372f477c7818204a66aa659ac280f1e66e8d164017c1d04cbac2de757ffb3d3551ed6117e345c0a30cac34642ce5b682497920186c0327e87ee980eebd5fb25ae8e3d1543d02218b51c80224e2ba1c97f2fc003fea1cf4a4682cbe75dc3eaec932e510d83a9f1e62ca72455b60dbc301fade0f20fdd5d2ce32bee28cc4de1e267b8137e1206cd8cf6005f8169c95b454f2eefbb039f813e7ea0c909bc1795582d5c3d511ea4ab7d62e15ebfe90f861ef1274f256e8ee601cc97aabd453f440c72c81b0e7c8d39bde01fd193d234c7c2bf558a07ac0d193be8d315e4c1c13312bbd3e868bbbe2b38bff2ccdcef8c099b0a3b2fbcc17ce5d1806796247205e22ebadafd237ba14de17b2db83870827526fe3aa49deb602ebde622b565a4d3363fc7e61815ce6c6fac07a8898e716eaba1bd0f3844ebbb6ef41bfdfad829669d46539ad8729fc51cbace5c0f5b90c7d6aa3e29a283c4c4a66580f24a0050d5d716d8ee0f8ea132004c5d4fdec2d0ffc59d8297a2fa46ab685504dc97ece15814931595d45feb1cf96c907e58cc2a6b752894db00b27ce0ac8b7741164c1b2d5af29632138cf672bbb452818e69a83d3c1dce40a5ad038e5529b15bbdd1a3a33a890b07c07160e550a09b65d2c7f4fd78a08fe81137afb57581579b07b6e137646c25bb5fa00f439236d0cbc8df982ac6aa2e49ab6ecc7fd9da423aad0e7ad60401e6cbed611172fa72d6a422df88426439f047babb7b8fe78ce864709cf4574235f4d59c6af5aba17c95ba2199a6b4cafaa8af86a2fcc3e9f179e54ecf956b58f3b90b0b88add4cc8f2ebbea272d6aec63d73b2375997d240b9d672904b020ebb7ae7f898a814b2bacaf0e3987bb303c01b13d4c31763def45940f2215af9c4a6e7558189e69480897402566064734c469385c8262436fd7ad96a7d7c9d305536baa3276777e2e10f3832808c2b2a9bf15985194428ea97c48bb9eb15950732a132043cac6d43b819e6fa4a7d402f85034867f4ad6eecbf0545eb9867888efcd25055ff8161a4dbdb69837824da5e6c35d2c32a2dce6c3459a7fada1008c424f0e075ede5ae2e928c43bd4a617c613735a18a2de088165c88265ee164cdf2b66fb0934854dbf8be9f976fa1fa96c29de1997c82455e12964db5fd5e872f8d9df48f2cf6b4965145f1f750c7f61ea0e0dc591559c08c732563c2bbd2ee0ba593a0f4ed251cba45f2469a8e75b28a2add7ccae163565d3ab140bb9214a75189186d1b450db171c201cf072a92c6e6cb8a88441b2729599ed795d4ab35c9239cb97fe7833ab173a3a0fbbf5a61fa729263b8cc08b5de7257a62b6c6d36d0551a3af8d601fa48a73578e3a5ea4040f7d97512325340fe94e46220766c8d3a10ed1738acfadc152a225fff3f6d99d5669dd4c25d9812273dcfe385068dafab7ec2196e0907539ce7cd26a0853a276bfc9a470707100f8b6e01b6359bab6abbf2aac5e86e1ba4b92e8b348b041e8f280cca6228c2a8836cb952f0408004a68170fc49',
			signature:
				'0xa72c80462ac2c4bb906a251e1614023a06691d8b92881746f571ea1c9d95903ef5b0ca21dca31468b72beca3d9c706ad1907b28425530a31ab984d46046346eb1fc5bf8853799942a7a4cc3d9843a9bb9d226f1affc433a2de5f3e16b86d4b193d62d849e6e1e3784351533dbb19ef0051c0b86d0426edc39a08877efa250a165d43a9fe97749b3372c779cef0145ac7ce4c60d89df9724d2685124371f871dc4ec510c1f27642da4f00a47b26791e79fa3cb910605bc51b1d5e86e11e02030178ec2e30929cf11925081f3930ceae996f9a711f8111a6d0634762efbebd6dce173c1d22be60ee0a37a886a76583eb3f568bd333f30b7424190d5ea4be0344c112b61e8ecfbc34aeb6a481e94d45ab1940e8d9eb17e23fd0941e62d6017c1012801d115cd950a22a0a334fd9738234bfd71c7119fc839db4e592bc10de4d30fb26fdeb39341c8142ccdcdb74e784a57f6b1d61e58ab632b19f3d2cc9d3943d1d6984bf6879ea9bd8f6e7cc224b7063ba2774a5b93bf7963cfcabedafa3974f6e9bd297b133286b294c1323acbf4f209cbb39d7f06db1d2dbd2585b9bf2af2f3aae262372008233664589abd83bc6bb3246317eec920cc712ea0c82bfcc01b052345a772872d1fcb98b9f9f140d673c1c85cef61bbacb9ea82b8987d562a8cbe0efe8414959bd6408796ba01e1fe1a416e158cb459786a9afd507def75dfc62f24e3e85228261e34b0bf81cbff0b3a478425b78568f3d6c6709cf8042e4e429bc4a3710be57892236459d934083b69a9abeaa9295cd7c9b49c4ba27ce401aa9f1ea2837d36430ca1be3a3ce14d3a72cfde0da427944dbdf613a98e1b3b08dcfd9d97d09d437491071025d96ce7a5bc08336a1096485460f6699b5c3d4873d021830d1d8ed9217eb46b3dde18f2687cc66733641abce006d255a2574d70a3196b40ba3618558624e96e59b6a3dd4a926783ab8588c86a773bcb4f77b85fd3319bef42c34dc32159683b4dd0a02c0f4bd47e136a81db8d3ebaf1accf8a9dcc3a00810d309414b2f193d560776fdb85cc1d512f92668fa361fcad15b282a5c8e893f8c1ed5c71d743938cee8a01e83bad8af29a327d18b0518c29dab6f490a7ac040e7232f13c1334fb145211b3ce99ee7dc8aae4e414ec47049ecd663cd1c5dd93833fcf01ba77bbbb8b7c1436a10d3a60e3da8b0cb42af9b3e89f15a966f4b4f5e112660ff4a844fe54797fb509b4d38f4ed41ca234a591bbee6a99b7752fc5577ad04375f6c790b7a3bc473763b6221d189db2c206cc04325d475e406d0f69f3c88f8b944db6143ce2fda2168f98fc14a025163ba68750b1545c84570eb21f636eef5138759d7777201028fa4141766ae2399127ea067e3a577b071ad3ae6d2952a513e6ad3f63fbe528475542814fe2ea34eecd7d8a872ed9009a5d343f880c80bda9a39a39017b0955945335a45f6ad6da2d6e36d574148b0266ac78b76cf685cd6d0a3beb7a13374324729b053ac33059ad856f066799d46dc7911b552219ee189d7120269eece6b609bf4742d5681dffec38a1b0a3f9e31f721ced3d430177d2c481c5cd75d6e882ec88d42ab59b628875f1dab2393e9ca5aa1bd186f0e7e5f7fbca1e8f67f5135790dc3b912c9370e30748dafbb6cfda197b6622def66f84a8a79d807f847a7867849578702406f004639510bea8db3f9f02436fb13b96dc6b16cb69012422a7464f27b96a7425d006c4c954f9a285315de10f84a7146c4aef5906c8b48c547c1e694766412ea2436477f992e45f5046b04faf2c6719160a3c4fadc36cb6b6785de9d44fb02aa1ca770794932fa2ebccd5acdf4f3e8c99691a10a525a4b52ace4b71ad2366bfbcb9a4dd72af3172cbaa457dd2a627697a50eb9af17ffa6fc344f86318a2896e050f84e4db5fbeed7bf3953c3998463cd7afe25874271bf0037cc6be4f4c4ffe3f9ac39d2e32232fda1387674ad39dafeee02c75cf075fb0da8f6e72eec88b6ee6184a94d5253c0f3e5357d3a483bca6a595f594bdbdb0b89119d4948d5ef17d02678d7d82c11c83bb1207981bcaef0b283a1b113e2efbe16820851c9a2de3d88a39e1298232d3873107a14a7c7e19eb62268f85f9405d87b4cd85a5df027fb3b3ae2512c1810c261c56a45187dc392cef7bd1e9a77041c23f2e4415d3e5d11ea5831d1875d332d4e52168148050c25c11b68290cab2d2a3ba9cd58a9fe403c0566c3c51ec484272dd4631fc7a505e821353427ab308df0150220300415be117607e150cae1de82fb93ef0d8a863046b7f9f93ae0bd1dcd10e97448217c24ad3b25317fadc20e96a0e92d25e87f249e30ce3df74610146a222c97545c06ef47e15b433abdbf03b4bffb8abd5305b46cc3cb7c153bbc3b3349cbfcb6cc3f1e17ac8aea39f68d3631c9e12564d654985193f79c30acee258173a6d3dd56f64048aac29701ae3660424c760535c7da7943431f7ca0d0d17a1778e51a7e0fb059f11427e020a6b4554c8bd95c22663c9ca556f09583813402c561a3ab3cd6843cb71d2189466914a024be42cf721ebb30b31ca63bc712e24455870a664cedb5a74741d650940bc5adeca88048aede3faf9b871ae324065eb9cdede84c7b6356f9708f24d51d21f4eed6f25cb093a1a28a611143f80554663b98b012f34b9a140357343225fa5e997765cf53f203e86ea55ed4fbb00e1063d541ea1d6ef1d8cd8e912d731025840eb80f0e50b0a5b533871d6790d6448c0a7c7fd8e454483ed0b3aa931790f4a2bbd9ce6da506bc01f8c5404c2acb5cab5979d206bb2d51c5a590b381a3bd2d9e14b0afd6b490664ce5164552988a96d051b7dbce38ec8d0ee39212c3135eb8dba3bfd7848ca7460db61df1432e2c58bf4adef67dd8e31c1950402c7501bd36abad9680ceea97db91a3e7c2ce96557419482a88c3d0286ebead0cff186182b69a19b9896e11eb29143e9e1b8a94f6f174e7bf976030c1f659fc54ac06bbb230ca33bc176c25bf114d95a2267d3d3a0975f7d8097c73a412d3a1614b2d8df907464aacf76e3596b4db50d330766fb2f53b249d922ebcb582309072c125859ec5dbcfe6d06ca85a045906c867c07aa27554a900c1ef253ab7577ccba56dfdc058ee923cafacdb243e68eda9d482e9056f84ddf510f3882e5af9f8404a0df4ba69d4b41d142a393f1dbec9e73e6f3b6fcc4f0c59c122405d8ededee69502c64ee2ba0594dde2d5d151470893fbe7bf651a484425976b92fa19152e41e51af501c716efbacfeac8be1e9a21f378be76287ee5e9176ef7872cc34d566c67c6dc180918c2996b92081915e1a034f29dc1a0e2ec27b83e67bd46f416b9d78874da99615de9b16d8f8df94b4756829502ad0ed8ef36972d519da7ae9b41a9b19d732d76d81a2c7fabffdd517738bb674d4f8fce95225c6e87c87b1319eca554bea4f4268db22f087cff5b6e344b6e51f06acf78471db51158a0132a8da0fb157b08fc963e07cbdd6d5e8f6b7f4f2ec8d57c40c8cb63f28a6a1a4e346749cf8927a5bb8233fc3971566501b9ca78248d225d553788ce2592f99f1f74933d9a0899bf591618f533b3d93676eae047a5e31069fe39ad460c852741f60bd518d245f314e3c2a23ee0611d0dc40d618214c00b1d197e0a490e9c9849bb5243ac9e4845fa7a777cf7c7f0b5a8a9bc34a8323b615568fc5bc4ed3debacc6727dad2fc5b498c438728a042b20d4b27a64df3b959dad45c206a7cb1f2e8906f910524cd122c5fcb5842dca066de486d93ef41f1b77a651a551f824fc017fc951dd253eb22f802853efe9c804803862cb5090da4b9617362e06438bb57523172665100e9214ea669cb6fe31b7f5285645c5eaac9eedc15100f65c0dc23265ad21d7cde8f04560143eeada1a21d377d512f274e28219617a77b4683b9bd99f058022e1c46b2f0a3d685b0ec5e1ed05fa2758f88386b1bcaf89de572648df3e7bb144bfdc4892f526ff3abe1e29ff7461053fc5fca681207a338fe128e9943f601cc0a39a21d11204f75b94a96509968dbee698497f7542f2c0f94cf783dbd6f6a288d27145a46065a1ded549d851aff2198e90398d19db272c3cb3fafe0e7d5025961275adbc6c7f8153d58b25a3dfbcc62dd5b4ae0b24f71f3ebbd09fae55ffc0e45c15be12e5cfe41addf9d2d73d258debed241be7be6e13fb0d6af1b996ec1096c1878a2723f623c5f89c3b95f9955d74a37d23a3b0f28351fa94a6dca95926f2036e9c2dfaddc6e3d072bc7aed30b274553f7443b191fb31b11dbb652942be3611f4f8e8ff6b0e3e821e4cdb95e3cdce4d11a6eb769bd3a439dde2c2f06fd8f30ff153e9763ddcbfcfda76fd0ab84c2ddf4e1eb27998ae0611851c7b9664759e6839673d4519e3d50ca65c8331a727d5332bbb3a0c31ff399e5c974c602cc2855cf59bb5c8dad81cc5b3f47339df9a37ef0c87e25d7ecc9d08cfba35136442e0a686664d627b3f56958796439aefa2812933bc8c7f2b5f0c3dee3f699e100d959e086e2ba51f9fdfd7b07b18796606f09cc505e1c92e0e5b6381bbe4c112c43f35e5a8583ae388ef38f824c1e49c1ef75ce610365777276522b09592d5b2f8fe4e4683e0f96853ee6b6c1291c2b984560d608ffd83bceef18c4a3172a13a98b7864e3b528d0c632a2ab0336b52636cb6ac6cb9e9cdda3a799bc88b07f6251cfecc14871951229978179bd6daa5721ceefb943e339008dee7362ab985318afe8d5ec5c1dfda9215837705dd29a337bda21397c0f7f7953606c4912583080ff215953935deb911c7639f1c7b3f3e0bf0d5bd9c921561d1ba51e47ea9b59971f243d400a572d56a0ac7f2ea826062d29d54067d62fd090bfe7a732b5eb8a7df4fbb5d61586db86f0bb2fc45540556b19dbf5f2c45323aa87652b5f47b15820d832392d2ef1ae965c14fa77333eb99ba863332e40904d6c573fad4beb1ec8ec25d8daf614cabe127015675c231fcde49f2e854fe326abd12071cf3f7a4b4ec83a36e0bbb621feada966d89dcd506ef91196d9f62cdeb132c1cfea1b3c6f95b07e3037c75bfe8bbe3d6f41e5177248e0260b38e03bc9106bfa60ef9c2e31c49bffd1dcd90f5c2d8369d819eec4348631f4c95296deb42ce24e41f076d2a725ed72528f746855104bcb0a30f23ae23d20ca5fc0b1c0c77cffc770e5c93df832eb7514f5481feffec4cf0e3006184de1913291b6425bf3c63e3222435eca7aa24933d3b55d7e01cac6db3b954c6c9a372a43ac98944ab6548cc44813d2dd9ade740dc9244cc37dc25b48a3e6266e128e92a9e8d53d404d8a2f388c4d0f8899c0b94dd0df3b988d5847570f3d671ef508295c8e089d801ea21bd6c0a775460e3d8cbce0633cb30ccebc787a97c1f26e1ce9fb73349fb3e474aeefae4a255cf36a8efca02f0fafa8e0eee3f3ed9b78b3309d2d6a1bf8c4034fa845a19ac7e86ed199495359b72f54053d38370829fef41faef2cb812e974ca6869db0c93dc62e884fceaf8ee837ea01dddc8a8f149fc6a8b2e0338d533968e4ebd89b75a0cb7a5fac2fa0e16c3343c97931187b3b4c8e1133daec009ec3e65772260c64affca973b640ab5060cb4fdc983b105f14928740ed6ec95e7825a70e4191896394eedfe486aa9c77a29d355eb8802d0856b7c4b9f230a8eeed605e43f72fcbdf7192052861a552c2cf1d8533039a84f9fc77afdb9d2c88b38184d40d6d50ed9e7823da53763235b4c2669237c7857be5e71dd170a4e0ef341de66dda9ac79df8c4aa8aee3e00bc5644586a40e415e8fb86e69e4905739e3d7b9540c82739be25be458df9296479fca33d75bbb9b4fbf7a7d7e64fd90bef65e9f32f40b6e5e37db1e410782b19de579599e769d469ab6a4dc0d6a8e2a4842196fee2fd1203444e7e2fb4fb5eaebd6b84803febad33ec48a7db89670c6df982c52f16241c0a36420c0eda485921db74d8ba4ae091e1cb9d33f170cc1687bc544e2cd605ed72a05697e7fe7d0383745875365f970ba58e403ca806d2091378da9fe32c21c49cd60647a1978eadffe79e000e02da7030e0008801777f3e060b448d89a4678de9dc048531a83de01c3ccd77c9371005a3e8cfa82cde828f4b5fb89ce49006d80fb492cfc7301419d6285819a4ac369787ee81ae52bd4de2136ecfa6902a53218c4b37b51bd4e07c3ecfe92073fbe7d8771a17b3bf779773c322a20c40ec9e8e055b0974bdc91262c6bf0a3f32d9f36617623d6b61b563bb0da1417d1384af2a1c1b31929732a93f15166de9faf49a2045f20c754a9419c1ddcc1584a900c404166ded19e22160da71595f44d026594feaa2ffba2a4637ac1e20fb9a5197df7736cc5ca7131ab554f4634ae6e1e361985803a9252b9f2fe521553b75421539c28323e49637f949a19364b4d537785c2d80b8c95aeb8f71e3d4c579bcdd0d8fb33466569a305363b721d3181dfe1fb909eab000000000000000000000000000000000000000000000000000811172025292f32',
			descriptor:
				'0x010000',
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
