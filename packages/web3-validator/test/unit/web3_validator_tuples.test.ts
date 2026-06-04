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
import { Web3Validator } from '../../src/web3_validator';

describe('web3-validator', () => {
	describe('Web3Validator', () => {
		let validator: Web3Validator;

		beforeEach(() => {
			validator = new Web3Validator();
		});
		describe('validate', () => {
			it('nested tuples', () => {
				const schema = [['uint', 'uint'], 'uint'];
				validator.validate(schema, [[7, 5], 3]);
			});
			it('nested tuples deep', () => {
				const address = 'Qd5812f6cf4a0f645aa620cd57319a0ed649dd8f5519a9dde7770ae5b0e49e547985f35eb972a2a07041561aa39c65a3991478f9b1e6749e05277dcf58a9a8b72';

				const schema = [
					[
						['uint', ['uint', ['uint', ['uint', 'uint'], 'address']]],
						['uint', 'uint'],
					],
					'uint',
				];
				validator.validate(schema, [
					[
						[7, [7, [7, [7, 5], address]]],
						[7, 5],
					],
					3,
				]);
			});
			it('nested tuples deep object schema', () => {
				const schema = {
					type: 'array',
					items: [
						{
							$id: '/0/0',
							format: 'uint',
							required: true,
						},
						{
							type: 'array',
							items: [
								{
									$id: '/0/0',
									format: 'uint',
									required: true,
								},
								{
									type: 'array',
									items: [
										{
											$id: '/0/0',
											format: 'uint',
											required: true,
										},
										{
											$id: '/0/1',
											format: 'uint',
											required: true,
										},
									],
									maxItems: 2,
									minItems: 2,
								},
							],
							maxItems: 2,
							minItems: 2,
						},
					],
					maxItems: 2,
					minItems: 2,
				};
				expect(validator.validateJSONSchema(schema, [7, [7, [7, 5]]])).toBeUndefined();
			});
		});
	});
});
