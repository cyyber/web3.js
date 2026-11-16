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

// Regenerates fixtures/abi/hyperion-<version>.json.
//
//   node scripts/abi-fixture/generate.js <path to a go-qrl checkout>
//
// The contract is compiled with the pinned @theqrl/hypc and every call is executed in
// go-qrl's VM. No expected byte in the fixture comes from a web3.js encoder: selectors come
// from the compiler, results from the VM, and the calldata arguments below are written out
// by hand, one 64-byte word at a time.

const { execFileSync } = require('child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');
const { compile, version } = require('@theqrl/hypc');

const fixtureDir = resolve(__dirname, '../../fixtures/abi');
const sourceName = 'AbiCompatibility.hyp';
const contractName = 'AbiCompatibility';

const goQrl = process.argv[2] && resolve(process.argv[2]);
if (!goQrl) {
	console.error('usage: node scripts/abi-fixture/generate.js <path to a go-qrl checkout>');
	process.exit(1);
}

const ACCOUNT = '0123456789abcdef'.repeat(8);
const WIDE = 'fedcba9876543210'.repeat(8);
const POINTER_SELECTOR = '5c36b186'; // ping()
const POINTER = `0x${ACCOUNT}${POINTER_SELECTOR}`;
const ADDRESS = `Q${ACCOUNT}`;
const MAX_UINT512 = (1n << 512n) - 1n;
const MIN_INT512 = -(1n << 511n);
const MAX_UINT256 = (1n << 256n) - 1n;
const MIN_INT256 = -(1n << 255n);
const SHIFTED = 1n << 400n;

// One 64-byte ABI word, two's complement for negative integers.
const word = value => {
	const n = BigInt(value);
	return (n < 0n ? (1n << 512n) + n : n).toString(16).padStart(128, '0');
};
const utf8Hex = text => Buffer.from(text, 'utf8').toString('hex');

const tuple = {
	components: [
		{ name: 'callback', type: 'function' },
		{ name: 'payload', type: 'bytes' },
	],
	type: 'tuple',
};

// Methods returning `bytes`: the compiler's own abi.encode / abi.encodePacked output. The
// abi.encode cases name explicit widths, as the compiler's ABI does, so that go-qrl's ABI
// package can read them; the packed cases and `calls` use the bare names.
const encodingCases = [
	{
		name: 'aliases',
		inputs: [{ type: 'uint512' }, { type: 'int512' }],
		values: [`${MAX_UINT512}`, `${MIN_INT512}`],
	},
	{
		name: 'narrowIntegers',
		inputs: [{ type: 'uint256' }, { type: 'int256' }],
		values: [`${MAX_UINT256}`, `${MIN_INT256}`],
	},
	{
		name: 'wideIntegers',
		inputs: [{ type: 'uint512' }, { type: 'int512' }],
		values: [`${SHIFTED}`, `${-SHIFTED}`],
	},
	{
		name: 'functionAndString',
		inputs: [{ type: 'function' }, { type: 'uint512' }, { type: 'string' }],
		values: [POINTER, '7', 'hello'],
	},
	{
		name: 'fixedFunctions',
		inputs: [{ type: 'function[2]' }, { type: 'uint512' }],
		values: [[POINTER, POINTER], '9'],
	},
	{
		name: 'dynamicFunctions',
		inputs: [{ type: 'function[]' }, { type: 'uint512' }],
		values: [[POINTER, POINTER], '9'],
	},
	{
		name: 'nestedFunction',
		inputs: [tuple, { type: 'uint512' }],
		values: [[POINTER, '0x010203'], '9'],
	},
	{
		name: 'packed',
		packed: true,
		inputs: [{ type: 'uint' }, { type: 'int' }, { type: 'function' }],
		values: ['1', '-2', POINTER],
	},
	{
		name: 'packedNarrow',
		packed: true,
		inputs: [{ type: 'uint256' }, { type: 'int256' }, { type: 'address' }, { type: 'bytes64' }],
		values: ['1', '-2', ADDRESS, `0x${WIDE}`],
	},
	{
		name: 'packedFunctions',
		packed: true,
		inputs: [{ type: 'function[2]' }],
		values: [[POINTER, POINTER]],
	},
	{
		name: 'packedIntegers',
		packed: true,
		inputs: [{ type: 'uint[2]' }, { type: 'int[2]' }],
		values: [
			['1', `${MAX_UINT512}`],
			['-2', `${MIN_INT512}`],
		],
	},
];

const panicCases = [
	{ name: 'panicAssert', code: '1', reason: 'assert(false)' },
	{ name: 'panicDivision', code: '18', reason: 'division or modulo by zero' },
	{ name: 'panicIndex', code: '50', reason: 'out-of-bounds access of an array or bytesN' },
];

// Calls with arguments. `signature` is the human-readable form with bare integers, which an
// SDK has to canonicalise to the compiler's selector.
const echoValues = [
	`${MAX_UINT512}`,
	`${MIN_INT512}`,
	`${MAX_UINT256}`,
	ADDRESS,
	`0x${WIDE}`,
	'hello',
];
const calls = [
	{
		name: 'echo',
		signature: 'echo(uint,int,uint256,address,bytes64,string)',
		values: echoValues,
		args:
			word(MAX_UINT512) +
			word(MIN_INT512) +
			word(MAX_UINT256) +
			ACCOUNT +
			WIDE +
			word(6 * 64) +
			word(5) +
			utf8Hex('hello').padEnd(128, '0'),
	},
	// The array is empty, so its getter reverts without data; only the selector is checked.
	{
		name: 'narrowValues',
		signature: 'narrowValues(uint)',
		values: ['0'],
		args: word(0),
		reverts: true,
	},
	{ name: 'balances', signature: 'balances(address)', values: [ADDRESS], args: ACCOUNT },
	{
		name: 'wideKeys',
		signature: 'wideKeys(bytes64,uint)',
		values: [`0x${WIDE}`, `${MAX_UINT512}`],
		args: WIDE + word(MAX_UINT512),
	},
];

const errorCases = [
	{ name: 'revertCustom', error: 'Custom', values: [`${MAX_UINT512}`, ADDRESS, 'hello'] },
	{ name: 'revertString', error: 'Error', values: ['hello'] },
];

const eventCases = [
	{
		name: 'emitIndexed',
		event: 'Indexed',
		signature: 'Indexed(address,bytes64,uint,int,string)',
		values: {
			who: ADDRESS,
			wide: `0x${WIDE}`,
			id: `${MAX_UINT512}`,
			value: '-2',
			note: 'hello',
		},
	},
];

const compilerInput = {
	language: 'Hyperion',
	settings: {
		optimizer: { enabled: true, runs: 200 },
		outputSelection: {
			'*': { '*': ['abi', 'qrvm.deployedBytecode.object', 'qrvm.methodIdentifiers'] },
		},
	},
	sources: { [sourceName]: { content: readFileSync(join(fixtureDir, sourceName), 'utf8') } },
};

const output = JSON.parse(compile(JSON.stringify(compilerInput)));
const errors = (output.errors ?? []).filter(error => error.severity === 'error');
if (errors.length > 0) {
	console.error(errors.map(error => error.formattedMessage).join('\n'));
	process.exit(1);
}
const contract = output.contracts[sourceName][contractName];
const bytecode = `0x${contract.qrvm.deployedBytecode.object}`;
const selectors = contract.qrvm.methodIdentifiers;
const selectorOf = name => {
	const matches = Object.keys(selectors).filter(signature => signature.startsWith(`${name}(`));
	if (matches.length !== 1) throw new Error(`expected exactly one method named ${name}`);
	return { canonical: matches[0], selector: `0x${selectors[matches[0]]}` };
};

// Run everything in go-qrl's VM. The runner is added to the checkout through a build
// overlay, so the checkout itself is not modified.
const scratch = mkdtempSync(join(tmpdir(), 'web3js-abi-fixture-'));
let results;
try {
	const overlay = join(scratch, 'overlay.json');
	writeFileSync(
		overlay,
		JSON.stringify({
			Replace: {
				[join(goQrl, 'cmd/web3js-abi-fixture/main.go')]: join(__dirname, 'run_vm.go'),
			},
		}),
	);
	const all = [...encodingCases, ...panicCases, ...errorCases, ...eventCases].map(({ name }) => ({
		name,
		callData: selectorOf(name).selector,
	}));
	for (const { name, args } of calls) {
		all.push({ name, callData: selectorOf(name).selector + args });
	}
	const stdout = execFileSync('go', ['run', '-overlay', overlay, './cmd/web3js-abi-fixture'], {
		cwd: goQrl,
		input: JSON.stringify({ bytecode, calls: all }),
		maxBuffer: 64 * 1024 * 1024,
	});
	results = new Map(
		JSON.parse(stdout).map(result => [
			result.name,
			{ ...result, callData: all.find(c => c.name === result.name).callData },
		]),
	);
} finally {
	rmSync(scratch, { recursive: true, force: true });
}

const run = (name, { reverted }) => {
	const result = results.get(name);
	if (result.reverted !== reverted) {
		throw new Error(`${name}: expected ${reverted ? 'a revert' : 'success'}`);
	}
	return result;
};

// Strip the outer ABI encoding of a single `bytes` return value: offset, length, data.
const unwrapBytes = hex => {
	const data = hex.slice(2);
	if (BigInt(`0x${data.slice(0, 128)}`) !== 64n) throw new Error('unexpected bytes offset');
	const length = Number(BigInt(`0x${data.slice(128, 256)}`));
	return `0x${data.slice(256, 256 + length * 2)}`;
};

const abiEntry = (type, name) => {
	const entries = contract.abi.filter(entry => entry.type === type && entry.name === name);
	if (entries.length !== 1) throw new Error(`expected exactly one ${type} named ${name}`);
	return entries[0];
};

const goQrlCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: goQrl }).toString().trim();

const fixture = {
	compiler: version(),
	vm: `go-qrl ${goQrlCommit}`,
	compilerInput,
	bytecode,
	abi: contract.abi,
	methodIdentifiers: selectors,
	cases: [
		...encodingCases.map(test => {
			const result = run(test.name, { reverted: false });
			return { ...test, callData: result.callData, encoded: unwrapBytes(result.output) };
		}),
		...panicCases.map(test => {
			const result = run(test.name, { reverted: true });
			return { ...test, panic: true, callData: result.callData, encoded: result.output };
		}),
	],
	calls: calls.map(({ name, signature, values, reverts = false }) => {
		const result = run(name, { reverted: reverts });
		return {
			name,
			signature,
			canonical: selectorOf(name).canonical,
			values,
			callData: result.callData,
			reverted: reverts,
			returned: result.output,
		};
	}),
	errors: errorCases.map(test => {
		const result = run(test.name, { reverted: true });
		return { ...test, callData: result.callData, encoded: result.output };
	}),
	events: eventCases.map(test => {
		const result = run(test.name, { reverted: false });
		if (result.logs.length !== 1) throw new Error(`${test.name}: expected exactly one log`);
		return {
			...test,
			abi: abiEntry('event', test.event),
			callData: result.callData,
			topics: result.logs[0].topics,
			data: result.logs[0].data,
		};
	}),
};

const target = join(fixtureDir, `hyperion-${version().split('+')[0]}.json`);
writeFileSync(target, `${JSON.stringify(fixture, null, '\t')}\n`);
console.log(`wrote ${target}`);
