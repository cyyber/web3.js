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
import { bytesToHex, hexToBytes } from '@theqrl/web3-utils';
import { Chain, Common, Hardfork } from '../../../src/common';

import { FeeMarketEIP1559Transaction } from '../../../src';

import testdata from '../../fixtures/json/eip1559.json';

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
			'0xa89ea66a21f1cec506a60e00cce3d4b9d3f4bb7955f58ab5105bbe6f9039b324',
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
			'0xfa81814f7dd57bad435657a05eabdba2815f41e3f15ddd6139027e7db56b0dea',
		);
		expect(unsignedTx.getMessageToSign(true)).toEqual(expectedHash);

		const expectedSerialization = hexToBytes(
			'0x02f85904808080809401010101010101010101010101010101010101018083010200f838f7940101010101010101010101010101010101010101e1a00101010101010101010101010101010101010101010101010101010101010101',
		);
		expect(unsignedTx.getMessageToSign(false)).toEqual(expectedSerialization);
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
				'0xa19d71fc9ad7c85f704b04040004cf6454e31ed7b5cb5001b344fd7b3c963e0605cd305c547e6e2a85f4f37afebb1147d74b820a21f81fcaf605cd214c97e86e9425df4bde1b31586710810885da505083e3d59e3a4b86aac6531ecddc0fd3f8ed9e3b07e32df9bd7bbdf7426374afb8b362c45de0b513b63d1d74598ec502cfcc8dda9b1631b3ed85444df5af5ca000d2be29bc711523a1c276e59fa3d1821984255481ddc3545302f94e9d35106d7dc63a2de24a3a9fa5da072c7dc3be5a6be7b194985b08ddfe392a1a42ac3ab0dea1670166372df9bf96d833308f124f1eea3012608b0f0447346fbab87d6f9c442f880b8f409f54d7d46e182d580e6960cab478612c74e6ec0f9e0069fb9ad1c01cc74ba53351d27941edae9c93e0e440339154087fe80bf18187c88a153080c0a2ff89d1f8a53b7fae5e92f607177b0da05e97a894840b17dab597330080bbc7b9ee4664be06c55febaf4a41a8dda66acce37acbe6ba3d9338211505b77822009b9c20bb5cc25b00820130cee701e5f88ab323790275eda8e337fd651877a198d0d01e127b7f6aaf4ac4548994b2e166be78386437415ab7a373432f4e8593855175700cc719bd3f8cf17941336430c30d1acc98d2fd1139fb715b8dcea06465fe6cc7218c93f66cead799740462d930354c6ebf8c93158aaefee8961f6de4dde6c1c5705e9b5f514b7d9cb1e968c7d2843f794015230a86d3ef9c91f83cc9e031ca8de190efdb093cf07b13393d540ae77d695704bf34912080a14873c4b9cfc987d3850ce2ab0680583e0bf4733586f049a92299e955e8a1896e84a32a094998fc4f2e4738c1ca0bdf802da0d1fb17977fb9ba8a239f24fc820d136bb36e39adfd974942058bdb383db3c4b0d41fd38dd5f50dfbe3915c93a623e6cb0c8c9e4e6d2d27c2a9fb774df4b5f8ab42e607226953a0ebb4370da9da00ac7a84675735b2983612b99b78a2887a430cdc5362d52ce002b46f33816027e77df78fc1bcd1a1d50a1fa2b48d2ab994658f4a732a6e9d4cd6f347cb697af7a87a26bbdd84a53f9eaf2f89f2e99fd05d722bda5ecc8e12a19703df2e67006d6671072258b291c1ab24dd4f80ec8aec376ae403d9edc59a3bdad4d94f2badadb0029b4ad2713383c1546c968c74172c8b72ec7d131d959e69e381a953cdf4b46bceceeb220934b0a782f52d61b7932469b190037dbc53d864f63937a0cf2ab0b7873b7648f5e1816ce49a3081ccd6de9d65d5a255bfd8746ef642b0531e7b4d7412aff7e807d5c87bd7f56e65f31645be711f4cec17d0586da7a6cee716b955891c677fdc67e474d5aa2951d4534a48ed2ce6c2bad133e58e9a3d1b977ab20ab8543714a840688aed71abef7c03e3371703e4a3cf69ba6bc60d6e01f01d607a295f00a4a90e1f05cd54a6e4ef056040400e799d7f172dfae0290292881c36a2f5249a2c3109723677603d7cba443f9c2cd3601aa8c5fdd34a77fb094f2d3a5fee9fde64d57a8c1ea0a92dc5d0f94cd4512ddc018ce430ce874a50e011404d6427e9887bb9997d934ba24843d99303ee9ffad2354b389e799771a4fc29d480b63780518f7e882762a99a51616fae4f9e4898d009512022209b61b81eb0ff25f4ca3d238cb6d1a998cccf26c2303ae8aa5641e61f607def6d162e6471a4eca4cc1437b967bd4e7b02600a0f8a36a6e7cbd77526c14109ff8f1604f0d2aa7e255e6b9e8c4b31465e20e4417a966c4f86024a7d779184f13b7584a42ba246c3092749cf82d17d31d5d3bd6dc694b282044723e5cc4bad38946c79fe576b99b1cd38a6938bc34ed19bd31243cbbf51497fac67a982a13aa7a6487c692bb02d4c6cc3b951ec31b047e207e4704d3c0c38d88fb705420bb735fce5a90acef24c133ff91e085c5a5960a93e031c4a2ba09aa182e9313bc4f5773aedba9b7e087e634088379a8a735378a8f5f99889d36d820b3e0d353eb1dbcb99c35097359f75a1f148554a08d00c4c5aa1ba3998dc41fd40c5af0a2a9b4025e955cd5126c9af329004f52ffb03e695446ad4307e77ce2cf87f093a541754f9026733b3ae37d0aeb9d082751677ec236334168dd57c0b8ae28e8bf74e9e3b1dda0b7520fe51b6e1501162bb5869412dbbeff90de272bcc7e1f3eae396afa0c4e89f2d420e1f09a2f11915fc8705107ed5532a1a27f7155b71582348e0c90138ab81ed599348dff97aa251468c84ae7d07a17a281944cd743dd3ceaa2f94f23ba75b12dfa087a10258f0b3c974f2e47d188c318e49b6ca5aef0075d6310391d32f24d9ed11d73efc4469388b4fd8358424fce92670d95af1e313e251f76bb6621ea97762a58f561c98200f9cf71031ae60586df9e763ba9315bc6a01a6c23b50a5047065f213fbb1bd4d4b8aa5e31670d41e1743db7ee6339e4fca181eec720a724a9239602012604e3ffa8ecbf76a4e9fe0067e4d662b4bcc3ddcbdb2e05d8648373e5f1fd715e34c00b11a0a1761880cdb6897e9139266575d60619ca012dea0632ac5587db03863b22b9c7718c0e34651d4316360e3d9e68a7ef5a84888ca432cd3ff62f61ddb7e97a86321474bb020d8cc8a66a373ef290adab8eb51e52eb6940926d47d49e131bee3d5128029d26c93c05bbb44abff0c914ab3832bc5db6114a68c689e0c5b5cbc60f3027ce0702a312a2dcaff4c84d9624aa8597ab8eeaff7c023cfc9f8575b62e89d98ca923d4c1df712d298f1a82ef112eaeba9b89bed84f72562d466fcc06ff35eb065a7afb4d46acdad729d2ef5dc7766174e3cbdbf474216de4cedca675db2710b03a88dbfb2da406527d7490017da1714861aff1b57d0fcc263c63eff1c969ac7bb675eae06a43d89048479a569f52222dac81b80794462af43fed8fd0d8922b82274a734b956a799fc3482a9824d15217383323877e4ac14242eac2d11236d13bc9529b4a4f25fedd6aec6872cf8ce377d8821d68613e60992398feed1f4cae903df8d05675ce12c78c9c900ba80c0bc1b37849a412e587eeef4659257b893b1ec78f74998ebb5f051c147d6c7e3cf3ce72a47e0cf88f0e869ba2491885800bc379d577206b377f668609cf583b69e09c0e25b247ab1c25ca7d91319000d3e583c3998875b1985d657f81de517651595b9d7a6c9b0a1e1fd9d465dc72a01e693d6e221e710ae26b8012d951adbba3d59bd265265e497f6e6e47329d58c624986f4d0962f42db87412c665059ab5c774f6544bf6de414f2969c951de49c07dd07d1464e843d51b6307916beb86a03b7c4566c297ea13a1b9e3666e65a190ba9c74c7ca7a9655a77801c04d01490571d75b6d224f5e583c66723e4c3d8084b6a4b3bde1de37c7b3a366bb71145085918003df987e314d825f69663a39c2033a1e45a774530c121757ef0dd980cc08423bdc408e3700113901f5e38710161fa6e6e83ff9513a3b50865efe03f656e00b1610b2f0f2fb83f022940a8ea936079e278291c1e572754411fc1d4351ce396750c0085c8d8b9fdb9e39670a83d19b44f3b7e0ece05056c37802cc507eadbd9c947be396e9322000e6f4b7459c35acd45ed777f465753afb097f39632390da9c3883cf48b157d9e18d996a72b133584473bca9abfd1b55e10498d6a10ca4ea4a72837e0355a85fc35143f5bbf0ff6898fb327165948cd15c9cd7afbf62f2aba263a41519e9bbc2e56181b8f61db359a09ce873618dd78dc3cba5f10bd2eaae86037fa270cfe9dd2d1be67c898f752b8bc9553e10002512daa257b20077f175b6d36dff4851926754c7bf7ae406cb0c9cd7250790f0a899a3ee1a037b99ab1a247407d6e0c5fcbf7a2fa3589ba21abd2d0d03bb4dca903f75791525cfccedb9e01fdaec1bf73450ea06971e052080f19843d00a28817b160379f839afab4e20ccdb673322d8495b98880c4c2f789acb313caad96bb03153b2ccb36a9f84c04dc5d744613ae3a8d274c3838fbad353cd0f7b40772008775d9c4a0dd4cf0c9be40d0c38b360e7508d80b0edc4e3d3c9f6b94e9b97f897ed55a7746900d4e8e9c22dc1bbd7556280587a002991b4091abb7eb8e6ac5a201715de7e81a8fa08dc7f87519fd8c1daccb3367aa0a18c913b2cb992da17a56d7d6d52dfc1d43dccf21eafe592b67b82fe3fc9d05054f7e9df6792c60cfd4fcac04a0274ddcb8ad380fc976ce11abaedeec2e3cde22fdc654d8a80070e54b722fe8fe250a26861da72e0343ad2f6e64904d2b867707741705d56a0fc2e9d9bf2dafd936e7a365586fa54a78d28a947fce5aa01aff3b07e7d1da91c114772ca4796ec704616837a8b968b5cc20ab83eb06fa86f0bd37d167a553e54ca222c0ad1949325543141071f2f19014b991e9930a9c05687e57ccdd73d9f7b3ca33d9bb4026db5e8fb159ab9885c1064c0053123255d1e3fc845212bcc91b32ef27fddd87e1aaa9e14a836cca4f6da68c715d8ba16caa370ef117cd92d3c7e05196c4e4ed7634548bfae25b5378fb40c8f5aded58762f322ff8fa270c1e36318cd4bbba73c9f64a01ae0fae1943ea5b0773f951a0f3cc5a96b91d8cae965850435aa8e76b050c4ecdcaf6e755f3c020b7f9c01d5d0012648e5309469a87349dd997220a47cf2d0120bbfb490fa913ce704f5fe286f16ef12318cbd417d80c1ca10e7d2749a9f399adcbcf5d38df3ae67404e09c544c8a54b0162e4801c81cfbb166a6dde826994a5d87298c9016aa7fedbd3ce67ad2d1996696895bfda04a7ff49fa4ccb9517b74a6ce9aecfc29c8119782479c208e4aa390e64fb522b127367cf17203af934d2875ac8a99a7515ab5914fe5038c61835c3b114e2da175fc174d0530a9e7c91ebeb88468781aef370570215751e9e1438370849613fe5cbb7eb1e4b6886ab3af3f2c3ac6289212ec3e4ac430eb83e9415b3892cb11974550f24e85394abbe4187e77c1379e228221b867395c4dece55418243c6fd8ba15dea82693af2391fe4ccb108f87ee79c94ce80a11ddb5e561820586a4e5328dbe842a5870deeaec8ec8a5b4c350c4e878d1b4d3ab070500127beb5776e5142ef5af53339aa18599a0895730c14fae3f30a037400d36068e1111211f514675286ae357aedf64f96133c4f7826c3b169bb53791256a79f199a4ef4bf1c0ac14979096cf0e7ebbef1210d448cbd568dbbdc522f55158cf877de8d9b692f1533c88987d73ff5cb605bf1e63038a7f28ea7eff9824b260cdbdcd24ae73213ea64a426763db3bf80c5b54704839508a8cadd8c351beaab9ebb3929e2f8bd364156737aa1ad8f08fbc163ee293e1bf69a8c9a5b7e0594b46df1a3da3e71ca12478aeb8122cc7a890c66add67a29e2ef00a3c171facab319ff0fc5f530f6c5be264c417e35335dab410abf2c4e8c705901552619181c37abd4628f0ee5d48b9c882c4b694ee21f214550eefdfe0183e6d3164b646420bd0b7a396a032e1b3b5a4bf67e79f75d99d7d8864ed0032e459b173d970cdd8935896977abdee5ff5a24f039104562954ea43c2bb78260b37f00dc5dd242bd05734ff9c9158f50502fa280192226feb4a4e85ed004b6b84f1654b1b8f368bc7afe12b20ab20aa3bd64bc70dc06fee20071545af03893fd2cedc0ead5eb773734dccd864647e2b1663781bdec8d67dec33056a214f8d55523a3781ee81c200b08120df0766769299ac9ff876daf6523cb220f3b9d327577589c46fdbb8289dbad42b3a8211ccd1adc8db92ffb1433c41dc7ccaeb90d088dd5e9609b8e73ea12f7c11630527504e8509da2edfa7f8aa555e833518f5eeb5ad798c2773f60f6f1586729a67819026528d007861f459cc71da300ff5c8cddc24fe0b0035aa3740b4b2e54cc31a48ba4c9742c2581b2ddc9f304bfcd9534538dc4c02848639a36b31e8642aab929cc6bebfa47b8605bb446e715de0bed167f0cb8107d4f65ae81e42b5fe40163d210e525e05f9a631c0f614122e9c8c01f3380478f75c84a1493ff9d4edb226ac4e8ada1bbfaaf10740cc87c9259edc9c3180a838846fd7d055c48096826f9b95914186ef5052b68bc995b8491186a494e5d2dc80279782cbefbe41ce88e66cdbfe32f52e8dd5151ed22eb2098d9a5e21e3c996fa228277d7bc4582d56dfe54768b4b8cadf2929cf3ec1bc037604ecd80749d33c8ad49bdbf28cd394a80d3986df1a4862459fbd5c5fb0c01545629d9c70197e3bffbd7b49ac8ce3ab462eb154baf7e15fc0eadae961ebf519cc68418b1c535b8dc0edd672277a378ff4fbaec4475e7c9ef12629c8a5cf59da48b23c4aa0291f5f036efced1d15e9498e1c58d2f90562bceee508bf593611713c3ec82845f5aed75781352365edd7bdb10d200aeb87455389a95865d83001ab6427bccbab1e33fe0c4fb4c4b3f7a4846c0938c993c5e637f879ab8c3ced8f7011026464a4d4e5f6eabc50b5984d2d6dc062031365c6678c0cc3541439ca9bad9f1131f2c363f92c5f302050d17293e4e51ec0e26ebeffa00000000000000000b161c252d353e43',
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
