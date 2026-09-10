#!/usr/bin/env node

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

/* eslint-disable header/header */
/* eslint-disable @typescript-eslint/no-var-requires */

/*
QRNS test fixtures.

Sources: fixtures/contracts/{QRNSRegistry,PublicResolver,NameWrapper}.hyp
Artifacts: fixtures/build/{QRNSRegistry,PublicResolver,NameWrapper}.{ts,json}

Compile with native hypc from https://github.com/cyyber/hyperion (optimizer
enabled, 200 runs). Do not compile them with scripts/compile_contracts.js
(@theqrl/hypc). Override the binary with HYPC_PATH if needed.

  pnpm compile:qrns-contracts

src/abi/qrns remains the published library ABI and is not generated here.
*/

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const LICENSE_HEADER = `/*
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
`;

const compiler = process.env.HYPC_PATH || 'hypc';
const version = execFileSync(compiler, ['--version'], { encoding: 'utf8' }).trim();
console.info(`Compiling QRNS fixtures with ${compiler}\n${version}`);

const root = resolve(__dirname, '..');
const buildPath = resolve(root, 'fixtures/build');
const names = ['QRNSRegistry', 'NameWrapper', 'PublicResolver'];
const sources = Object.fromEntries(
	names.map(name => [
		`${name}.hyp`,
		{ content: readFileSync(resolve(root, `fixtures/contracts/${name}.hyp`), 'utf8') },
	]),
);
const input = {
	language: 'Hyperion',
	sources,
	settings: {
		optimizer: { enabled: true, runs: 200 },
		outputSelection: {
			'*': { '*': ['abi', 'qrvm.bytecode.object', 'qrvm.deployedBytecode.object'] },
		},
	},
};
const output = JSON.parse(
	execFileSync(compiler, ['--standard-json'], {
		input: JSON.stringify(input),
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
	}),
);
const errors = (output.errors || []).filter(error => error.severity === 'error');
if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));

if (!existsSync(buildPath)) {
	mkdirSync(buildPath);
}

for (const name of names) {
	const contract = output.contracts[`${name}.hyp`][name];
	const bytecode = contract.qrvm.bytecode.object;
	writeFileSync(
		resolve(buildPath, `${name}.ts`),
		`${LICENSE_HEADER}export const ${name}Abi = ${JSON.stringify(
			contract.abi,
		)} as const;\nexport const ${name}Bytecode = '0x${bytecode}';\n`,
	);
	writeFileSync(resolve(buildPath, `${name}.json`), `${JSON.stringify(contract, null, '\t')}\n`);
}

console.info('Compiled QRNS fixtures successfully');
