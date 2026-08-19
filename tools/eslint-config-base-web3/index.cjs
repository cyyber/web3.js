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

const fs = require('node:fs');
const path = require('node:path');

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import-x');
const jest = require('eslint-plugin-jest');
const noNull = require('eslint-plugin-no-null');
const tsdoc = require('eslint-plugin-tsdoc');
const globals = require('globals');

const deprecatedNoopRule = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create: () => ({}),
};

const license = [
	'',
	'This file is part of web3.js.',
	'',
	'web3.js is free software: you can redistribute it and/or modify',
	'it under the terms of the GNU Lesser General Public License as published by',
	'the Free Software Foundation, either version 3 of the License, or',
	'(at your option) any later version.',
	'',
	'web3.js is distributed in the hope that it will be useful,',
	'but WITHOUT ANY WARRANTY; without even the implied warranty of',
	'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the',
	'GNU Lesser General Public License for more details.',
	'',
	'You should have received a copy of the GNU Lesser General Public License',
	'along with web3.js.  If not, see <http://www.gnu.org/licenses/>.',
	'',
];

const licenseComment = `\n${license.slice(1).join('\n')}\n`;

const qrlHeader = {
	rules: {
		header: {
			meta: {
				type: 'layout',
				docs: {
					description: 'require the repository LGPL header block',
				},
				schema: [],
				messages: {
					missing: 'Missing repository LGPL header block.',
				},
			},
			create(context) {
				return {
					Program(node) {
						const sourceCode = context.sourceCode;
						const firstComment = sourceCode.getAllComments()[0];
							if (
								firstComment &&
								firstComment.type === 'Block' &&
								firstComment.value.trim() === licenseComment.trim()
							) {
								return;
							}

						context.report({ node, messageId: 'missing' });
					},
				};
			},
		},
	},
};

const requireExtensions = {
	rules: {
		'require-extensions': {
			meta: {
				type: 'problem',
				fixable: 'code',
				schema: [],
				messages: {
					missing: 'Relative imports and exports must end with .js',
				},
			},
			create(context) {
				const sourceCode = context.sourceCode;

				function checkNode(node) {
					const source = node.source;
					if (!source || typeof source.value !== 'string') return;
					const value = source.value.replace(/\?.*$/, '');
					if (!value || !value.startsWith('.') || value.endsWith('.js')) return;

					const fileName = context.filename || context.getFilename?.();
					if (!fileName || fileName === '<input>') return;

					const importPath = path.resolve(path.dirname(fileName), value);
					if (fs.existsSync(importPath)) return;

					context.report({
						node,
						messageId: 'missing',
						fix:
							source.value.includes('?') || sourceCode.getText(source).startsWith('"')
								? undefined
								: fixer => fixer.replaceText(source, `'${source.value}.js'`),
					});
				}

				return {
					ExportAllDeclaration: checkNode,
					ExportNamedDeclaration: checkNode,
					ImportDeclaration: checkNode,
				};
			},
		},
	},
};

const sourceRules = {
	'require-extensions/require-extensions': 'error',
	'qrl-header/header': 'warn',
	'deprecation/deprecation': 'off',
	'header/header': 'off',
	'class-methods-use-this': ['error'],
	'no-unused-expressions': ['error'],
	'no-continue': 'off',
	'no-underscore-dangle': 'off',
	'import/prefer-default-export': 'off',
	'lines-between-class-members': 'off',
	'no-use-before-define': ['error'],
	'no-shadow': 'off',
	'no-console': ['error', { allow: ['error', 'info', 'warn'] }],
	'no-unassigned-vars': 'warn',
	'prefer-const': 'warn',
	'no-useless-assignment': 'warn',
	'preserve-caught-error': 'warn',
	'import/extensions': 'off',
	'no-await-in-loop': ['error'],
	'no-restricted-syntax': [
		'error',
		{
			selector: 'ForInStatement',
			message:
				'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
		},
		{
			selector: 'LabeledStatement',
			message:
				'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
		},
		{
			selector: 'WithStatement',
			message:
				'`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
		},
	],
	'no-null/no-null': ['error'],
	'tsdoc/syntax': 'warn',
};

const typeScriptRules = {
	'@typescript-eslint/no-shadow': ['error'],
	'@typescript-eslint/no-floating-promises': ['error'],
	'@typescript-eslint/prefer-for-of': ['error'],
	'@typescript-eslint/consistent-type-assertions': ['error'],
	'@typescript-eslint/explicit-member-accessibility': ['error'],
	'@typescript-eslint/member-ordering': [
		'error',
		{ default: ['public-static-field', 'public-instance-method'] },
	],
	'@typescript-eslint/no-extraneous-class': ['error'],
	'@typescript-eslint/no-unnecessary-boolean-literal-compare': ['error'],
	'@typescript-eslint/no-unnecessary-qualifier': ['error'],
	'@typescript-eslint/no-unnecessary-type-arguments': ['error'],
	'@typescript-eslint/prefer-function-type': ['error'],
	'@typescript-eslint/prefer-includes': ['error'],
	'@typescript-eslint/prefer-nullish-coalescing': ['warn'],
	'@typescript-eslint/prefer-optional-chain': ['warn'],
	'@typescript-eslint/prefer-readonly': ['error'],
	'@typescript-eslint/prefer-reduce-type-parameter': ['error'],
	'@typescript-eslint/prefer-string-starts-ends-with': ['error'],
	'@typescript-eslint/prefer-ts-expect-error': ['error'],
	'@typescript-eslint/promise-function-async': ['error'],
	'@typescript-eslint/require-array-sort-compare': ['error'],
	'@typescript-eslint/switch-exhaustiveness-check': ['warn'],
	'@typescript-eslint/unified-signatures': 'off',
	'@typescript-eslint/no-unused-expressions': ['error'],
	'@typescript-eslint/no-useless-constructor': ['error'],
	'@typescript-eslint/explicit-module-boundary-types': 'off',
	'@typescript-eslint/no-unused-vars': 'warn',
	'@typescript-eslint/no-base-to-string': 'warn',
	'@typescript-eslint/no-duplicate-type-constituents': 'warn',
	'@typescript-eslint/no-empty-object-type': 'warn',
	'@typescript-eslint/no-explicit-any': 'warn',
	'@typescript-eslint/no-misused-promises': 'warn',
	'@typescript-eslint/no-redundant-type-constituents': 'warn',
	'@typescript-eslint/no-unnecessary-type-assertion': 'off',
	'@typescript-eslint/no-unsafe-enum-comparison': 'warn',
	'@typescript-eslint/no-unsafe-argument': 'warn',
	'@typescript-eslint/no-unsafe-assignment': 'warn',
	'@typescript-eslint/no-unsafe-call': 'warn',
	'@typescript-eslint/no-unsafe-member-access': 'warn',
	'@typescript-eslint/no-unsafe-return': 'warn',
	'@typescript-eslint/only-throw-error': 'warn',
	'@typescript-eslint/require-await': 'warn',
	'@typescript-eslint/prefer-promise-reject-errors': 'warn',
	'@typescript-eslint/restrict-template-expressions': 'warn',
};

const testRules = {
	'require-extensions/require-extensions': 'off',
	'jest/valid-title': ['error'],
	'jest/no-conditional-expect': ['error'],
	'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
	'jest/consistent-test-it': ['error'],
	'class-methods-use-this': ['error'],
	'dot-notation': 'off',
	'lines-between-class-members': 'off',
	'arrow-body-style': 'off',
	'no-underscore-dangle': 'off',
	'no-null/no-null': ['error'],
};

// Rules that need `strictNullChecks` to work. Under a project that turns it
// off they cannot analyse anything and instead emit a single file-level
// "requires the strictNullChecks compiler option" message. They are switched
// off per project, and only for projects that actually relax the option — see
// `strictNullChecksEnabled`.
const testFiles = ['**/test/**/*.{js,cjs,mjs,ts}', '**/*.test.ts'];
const testTypeScriptFiles = ['**/test/**/*.ts', '**/*.test.ts'];

// Test support that does not live under a `test/` directory. `lint-staged`
// runs `eslint` on the real path, while `eslint .` inside a package sees the
// symlink under `test/fixtures/`; without this the same file would be linted
// against two different rule profiles depending on how it was reached.
const sharedTestSources = ['scripts/system_tests_utils.ts'];

const nullCheckDependentRuleNames = [
	'@typescript-eslint/no-unnecessary-boolean-literal-compare',
	'@typescript-eslint/prefer-nullish-coalescing',
];

const nullCheckDependentRulesOff = Object.fromEntries(
	nullCheckDependentRuleNames.map(rule => [rule, 'off']),
);

const testTypeScriptRules = {
	'@typescript-eslint/no-magic-numbers': 'off',
	'@typescript-eslint/unbound-method': 'off',
	'@typescript-eslint/no-require-imports': ['error'],
	'@typescript-eslint/no-explicit-any': 'off',
	'@typescript-eslint/no-unsafe-argument': 'off',
	'@typescript-eslint/no-unsafe-assignment': 'off',
	'@typescript-eslint/no-unsafe-member-access': 'off',
	'@typescript-eslint/no-unsafe-call': ['warn'],
	'@typescript-eslint/no-unsafe-return': ['warn'],
	'@typescript-eslint/no-unnecessary-type-assertion': 'off',
	'@typescript-eslint/no-empty-function': ['error'],
	'@typescript-eslint/require-await': ['warn'],
	'@typescript-eslint/restrict-template-expressions': ['warn'],
};

const legacyNullRestriction = {
	'@typescript-eslint/no-restricted-types': 'off',
};

// Type-safety rules that are `warn` repo-wide. For a small set of
// security-relevant packages whose production sources are already CLEAN of these
// warnings (verified with `pnpm run lint:budget` / eslint), we escalate them to
// `error` so a regression cannot slip in as just another warning. Scope is
// `src/**` only: test files keep the relaxed `warn`/`off` treatment.
// Re-asserted (rather than left unset) so that a project block is independent
// of whatever block matched the same file earlier: an empty `rules` cannot undo
// an `off` from a previous block. Severities come from `typeScriptRules` so
// there is still one source of truth.
const nullCheckDependentRulesOn = Object.fromEntries(
	nullCheckDependentRuleNames.map(rule => [rule, typeScriptRules[rule]]),
);

const escalatedTypeSafetyRules = {
	'@typescript-eslint/no-explicit-any': 'error',
	'@typescript-eslint/no-misused-promises': 'error',
	'@typescript-eslint/no-unsafe-argument': 'error',
	'@typescript-eslint/no-unsafe-assignment': 'error',
	'@typescript-eslint/no-unsafe-call': 'error',
	'@typescript-eslint/no-unsafe-member-access': 'error',
	'@typescript-eslint/no-unsafe-return': 'error',
};

// The provider packages are the repository's untrusted-input boundary: they read
// and parse HTTP / WebSocket / IPC JSON-RPC responses. Their production sources
// currently carry ZERO of the rules above, so we hold that line at `error`.
const typeSafetyStrictPackages = [
	'packages/web3-providers-http',
	'packages/web3-providers-ipc',
	'packages/web3-providers-ws',
];

function existingProjects(rootDir, patterns) {
	return patterns
		.map(pattern => path.join(rootDir, pattern))
		.filter(projectPath => fs.existsSync(projectPath))
		.map(projectPath => path.relative(rootDir, projectPath).split(path.sep).join('/'));
}

// Effective `strictNullChecks` for a tsconfig, following its `extends` chain.
// Falls back to `true` when TypeScript cannot be loaded, which keeps
// `nullCheckDependentRules` enabled — the direction that never hides a finding.
function strictNullChecksEnabled(rootDir, project) {
	let ts;
	try {
		// typescript is a peer of @typescript-eslint/parser, so it is always
		// present wherever this config does type-aware linting.
		ts = require('typescript');
	} catch {
		return true;
	}

	const parsed = ts.getParsedCommandLineOfConfigFile(path.join(rootDir, project), {}, {
		...ts.sys,
		onUnRecoverableConfigFileDiagnostic() {},
	});
	if (!parsed) return true;

	return parsed.options.strictNullChecks ?? parsed.options.strict ?? false;
}

function workspaceDirectories(rootDir) {
	return ['packages', 'tools'].flatMap(parent => {
		const parentPath = path.join(rootDir, parent);
		if (!fs.existsSync(parentPath)) return [];
		return fs
			.readdirSync(parentPath, { withFileTypes: true })
			.filter(entry => entry.isDirectory())
			.map(entry => `${parent}/${entry.name}`);
	});
}

function createWeb3Config({ rootDir }) {
	const workspaceDirs = workspaceDirectories(rootDir);
	const typedProjects = existingProjects(rootDir, [
		'tsconfig.base.json',
		...workspaceDirs.flatMap(directory => [
			`${directory}/tsconfig.esm.json`,
			`${directory}/tsconfig.json`,
			`${directory}/test/tsconfig.json`,
		]),
		'packages/web3/test/cjs_black_box/tsconfig.json',
		'packages/web3/test/esm_black_box/tsconfig.json',
	]);

	// `tsconfig.base.json` declares no `include`, so it globs the whole
	// repository, and it declares no `compilerOptions.types` — which since
	// TypeScript 6.0 means NO ambient `@types` at all (only a literal `"*"`
	// entry restores the old auto-inclusion). Any file typed by it therefore
	// sees no Jest globals: `describe` / `it` / `expect` have no declarations,
	// every test call is an unresolved type, and `no-unsafe-*` fires on all of
	// them.
	//
	// Every package already ships a `test/tsconfig.json` carrying
	// `"types": ["node", "jest"]`. The blocks below pin each package's tests to
	// exactly that one project.
	//
	// A single repo-wide cascade (specific projects first, base last) is NOT
	// enough. typescript-eslint honours array order only on its single-run
	// (CLI) path; in watch mode — what editors and long-lived processes use —
	// it scans a cache of already-created watch programs in insertion order, so
	// the repo-wide `tsconfig.base.json` program gets reused for test files and
	// the phantom warnings come back. A one-entry `project` makes membership
	// unambiguous in both modes. It is also much cheaper: a cascade builds a
	// program per candidate project on every package's lint run.
	const projectBlock = (files, project) => ({
		files,
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: [project],
				tsconfigRootDir: rootDir,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
		},
		rules: strictNullChecksEnabled(rootDir, project)
			? nullCheckDependentRulesOn
			: nullCheckDependentRulesOff,
	});

	const hasProject = project => fs.existsSync(path.join(rootDir, project));

	// One block per workspace package that ships its own test project.
	const packageTestBlocks = workspaceDirs
		.map(directory => ({ directory, project: `${directory}/test/tsconfig.json` }))
		.filter(({ project }) => hasProject(project))
		.map(({ directory, project }) =>
			projectBlock([`${directory}/test/**/*.ts`, `${directory}/**/*.test.ts`], project),
		);

	// The black-box suites live under `packages/web3/test/` and have their own
	// projects, so they must come after the `packages/web3` block above.
	const blackBoxTestBlocks = [
		'packages/web3/test/cjs_black_box',
		'packages/web3/test/esm_black_box',
	]
		.map(directory => ({ directory, project: `${directory}/tsconfig.json` }))
		.filter(({ project }) => hasProject(project))
		.map(({ directory, project }) => projectBlock([`${directory}/**/*.ts`], project));

	// `scripts/` and `scripts/changelog/` are outside the workspace packages but
	// still contain TypeScript that gets linted directly — by `lint-staged`, and
	// by editors. `scripts/system_tests_utils.ts` matters most: it is symlinked
	// into nearly every package as `test/fixtures/system_test{s,}_utils.ts`, so
	// it is linted under two different paths and must resolve the same way from
	// both.
	const scriptsProjectBlocks = [
		{ directory: 'scripts', project: 'scripts/tsconfig.json' },
		{ directory: 'scripts/changelog', project: 'scripts/changelog/tsconfig.json' },
	]
		.filter(({ project }) => hasProject(project))
		.map(({ directory, project }) => projectBlock([`${directory}/**/*.ts`], project));

	return [
		{
			ignores: [
				'**/node_modules/**',
				'**/lib/**',
				'**/dist/**',
				'**/coverage/**',
				'**/.coverage/**',
				'**/.turbo/**',
				'docs/build/**',
				'**/cypress/**',
				'**/cypress.config.js',
				'**/jest.config.js',
				'**/src/common/chains/**',
				'**/src/common/qips/**',
				'**/src/common/hardforks/**',
				'tmp/**',
			],
		},
		js.configs.recommended,
		...tsPlugin.configs['flat/recommended-type-checked'].map(config => ({
			...config,
			files: ['**/*.ts'],
		})),
		prettier,
		{
			files: ['**/*.{js,cjs,mjs,ts}'],
			languageOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				globals: {
					...globals.browser,
					...globals.node,
					BigInt: 'readonly',
				},
			},
			plugins: {
					import: importPlugin,
					deprecation: { rules: { deprecation: deprecatedNoopRule } },
					header: qrlHeader,
					'no-null': noNull,
					'qrl-header': qrlHeader,
					'require-extensions': requireExtensions,
				tsdoc,
			},
			rules: sourceRules,
		},
		{
			files: ['**/*.ts'],
			languageOptions: {
				parser: tsParser,
				parserOptions: {
					project: typedProjects,
					tsconfigRootDir: rootDir,
					sourceType: 'module',
				},
			},
			plugins: {
				'@typescript-eslint': tsPlugin,
			},
				rules: {
					...typeScriptRules,
					...legacyNullRestriction,
				},
			},
			{
				files: ['packages/abi/src/**/*.ts'],
				rules: {
					'@typescript-eslint/consistent-type-assertions': 'warn',
					'@typescript-eslint/explicit-member-accessibility': 'warn',
					'@typescript-eslint/no-for-in-array': 'warn',
					'@typescript-eslint/no-shadow': 'warn',
					'@typescript-eslint/unbound-method': 'warn',
					'@typescript-eslint/prefer-for-of': 'warn',
					'class-methods-use-this': 'warn',
					'no-case-declarations': 'warn',
					'no-console': 'warn',
					'no-empty': 'warn',
					'no-null/no-null': 'warn',
					'no-restricted-syntax': 'warn',
					'no-use-before-define': 'warn',
				},
			},
		{
			files: [...testFiles, ...sharedTestSources],
			languageOptions: {
				globals: {
					...globals.jest,
				},
			},
			plugins: {
				'@typescript-eslint': tsPlugin,
				jest,
			},
			rules: testRules,
		},
		{
			files: [...testTypeScriptFiles, ...sharedTestSources],
			plugins: {
				'@typescript-eslint': tsPlugin,
			},
			rules: testTypeScriptRules,
		},
		// Per-project typing overrides. These only set `parserOptions.project`
		// (plus the rules that depend on the project's `strictNullChecks`), so
		// the rule profiles above still apply. Anything they do not match keeps
		// resolving through `typedProjects`, i.e. `tsconfig.base.json`.
		...packageTestBlocks,
		...blackBoxTestBlocks,
		...scriptsProjectBlocks,
		// Escalation overrides come last so they win for the matched sources.
		// They target `src/**` only, so they never overlap the test overrides
		// above.
		...typeSafetyStrictPackages.map(pkg => ({
			files: [`${pkg}/src/**/*.ts`],
			plugins: {
				'@typescript-eslint': tsPlugin,
			},
			rules: escalatedTypeSafetyRules,
		})),
	];
}

module.exports = {
	createWeb3Config,
};
