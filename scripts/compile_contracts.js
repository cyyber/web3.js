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

const { spawnSync } = require('child_process');
const { resolve, relative, sep } = require('path');
const { rmSync, readdirSync, writeFileSync, mkdirSync } = require('fs');

// Fetch path of build
const projectPath = resolve(__dirname, '..');
const buildPath = resolve(__dirname, '../fixtures/build');
const contractsPath = resolve(__dirname, '../fixtures/contracts');
const importDir = resolve(__dirname, '../node_modules');
const compilerPath = process.env.HYPC_PATH ?? 'hypc';
const requiredCompilerCommit = 'f2e6ae7a';
const generatedFileHeader = `/*
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

const runCompiler = args => {
	const result = spawnSync(compilerPath, args, {
		encoding: 'utf8',
		maxBuffer: 100 * 1024 * 1024,
	});

	if (result.error) {
		throw new Error(
			`Unable to run ${compilerPath}. Build cyyber/hyperion at ${requiredCompilerCommit} and set HYPC_PATH.`,
			{ cause: result.error },
		);
	}
	if (result.status !== 0) {
		throw new Error(result.stderr || `${compilerPath} exited with status ${result.status}`);
	}

	return result.stdout;
};

const compilerVersion = runCompiler(['--version']);
if (!compilerVersion.includes(`commit.${requiredCompilerCommit}`)) {
	throw new Error(
		`Expected cyyber/hyperion commit ${requiredCompilerCommit}, received: ${compilerVersion.trim()}`,
	);
}

(async () => {
	rmSync(buildPath, { recursive: true, force: true });

	// Fetch all Contract files in Contracts folder
	const fileNames = readdirSync(contractsPath)
		.filter(fileName => fileName.endsWith('.hyp'))
		.sort();

	// Re-Create build folder for output files from each contract
	mkdirSync(buildPath);

	for (const fileName of fileNames) {
		const contractName = fileName.replace('.hyp', '');
		const filePath = resolve(contractsPath, fileName);
		const sourceName = relative(projectPath, filePath).split(sep).join('/');
		const compileResult = JSON.parse(
			runCompiler([
				'--base-path',
				projectPath,
				'--include-path',
				importDir,
				'--combined-json',
				'abi,bin',
				filePath,
			]),
		);
		const compiledContract = compileResult.contracts[`${sourceName}:${contractName}`];

		if (!compiledContract) {
			throw new Error(`Compiler did not return ${sourceName}:${contractName}`);
		}

		const contractBuild = {
			abi: compiledContract.abi,
			qrvm: { bytecode: { object: compiledContract.bin } },
		};

		const contractTsInterface = `${generatedFileHeader}export const ${contractName}Abi = ${JSON.stringify(
			contractBuild.abi,
		)} as const; \n export const ${contractName}Bytecode = '0x${
			contractBuild.qrvm.bytecode.object
		}';`;

		writeFileSync(
			resolve(buildPath, contractName + '.json'),
			JSON.stringify(contractBuild, undefined, '\t'),
		);
		writeFileSync(resolve(buildPath, contractName + '.ts'), contractTsInterface);
	}

	console.info('Compiled successfully');
})().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
