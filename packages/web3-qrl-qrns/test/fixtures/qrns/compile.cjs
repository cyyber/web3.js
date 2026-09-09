// SPDX-License-Identifier: MIT
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { execFileSync } = require('node:child_process');

const compiler = process.env.HYPC_PATH || 'hypc';
const version = execFileSync(compiler, ['--version'], { encoding: 'utf8' });
if (!version.includes('commit.2b9a0f1d')) {
	throw new Error('Use Hyperion commit 2b9a0f1d via HYPC_PATH to regenerate these fixtures.');
}

const root = resolve(__dirname, '../../../../..');
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

for (const name of names) {
	const contract = output.contracts[`${name}.hyp`][name];
	const bytecodeFile = resolve(__dirname, `bytecode/${name}Bytecode.ts`);
	writeFileSync(
		bytecodeFile,
		readFileSync(bytecodeFile, 'utf8').replace(
			/0x[0-9a-fA-F]+/,
			`0x${contract.qrvm.bytecode.object}`,
		),
	);
	if (name === 'QRNSRegistry') {
		const artifactFile = resolve(__dirname, 'QRNSRegistry.json');
		const artifact = JSON.parse(readFileSync(artifactFile, 'utf8'));
		artifact.bytecode = `0x${contract.qrvm.bytecode.object}`;
		artifact.deployedBytecode = `0x${contract.qrvm.deployedBytecode.object}`;
		writeFileSync(artifactFile, `${JSON.stringify(artifact, null, '\t')}\n`);
	}
}
