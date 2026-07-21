#!/usr/bin/env node

/*
 * Per-package ESLint warning budget (a.k.a. lint ratchet).
 *
 * The repository lints with the type-safety rules (no-unsafe-*, no-explicit-any,
 * no-misused-promises, ...) set to `warn`, so `pnpm run lint` stays green while
 * carrying thousands of warnings. A single fresh unsafe cast is invisible among
 * its siblings and CI never notices. Warnings therefore cannot act as a
 * regression detector on their own.
 *
 * This script closes that gap. It runs ESLint per workspace package exactly the
 * way `turbo run lint` does (`eslint .` from each package directory), counts the
 * warnings each package emits, and compares them against a committed baseline in
 * `.lint-budget.json`. If any package emits MORE warnings than its baseline the
 * script exits non-zero, so new warnings can never hide. Fewer warnings is a
 * win; equal is fine.
 *
 * Usage:
 *   node scripts/lint-budget.js            Check current counts against baseline.
 *   node scripts/lint-budget.js --update   Ratchet the baseline DOWN to match
 *                                          current counts and register any new
 *                                          package. Never raises an existing
 *                                          budget unless --allow-raise is given.
 *   node scripts/lint-budget.js --update --allow-raise
 *                                          Rewrite the baseline to the current
 *                                          counts verbatim (used to (re)generate
 *                                          the baseline; use deliberately).
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const baselineFile = path.join(root, '.lint-budget.json');
const eslintBin = path.join(root, 'node_modules', '.bin', 'eslint');

const args = new Set(process.argv.slice(2));
const isUpdate = args.has('--update');
const allowRaise = args.has('--allow-raise');

const toPosix = value => value.split(path.sep).join('/');

// Discover workspaces (packages/*, tools/*) that define a `lint` script, i.e.
// exactly the set `turbo run lint --filter="./packages/*" --filter="./tools/*"`
// operates on.
function workspaces() {
	return ['packages', 'tools']
		.flatMap(parent => {
			const parentPath = path.join(root, parent);
			if (!fs.existsSync(parentPath)) return [];
			return fs
				.readdirSync(parentPath, { withFileTypes: true })
				.filter(entry => entry.isDirectory())
				.map(entry => `${parent}/${entry.name}`);
		})
		.filter(dir => {
			const pkgPath = path.join(root, dir, 'package.json');
			if (!fs.existsSync(pkgPath)) return false;
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
			return Boolean(pkg.scripts && pkg.scripts.lint);
		})
		.sort();
}

// Run `eslint . -f json` inside a workspace and return its warning/error counts.
function lintWorkspace(dir) {
	const result = spawnSync(eslintBin, ['.', '--format', 'json'], {
		cwd: path.join(root, dir),
		encoding: 'utf8',
		maxBuffer: 256 * 1024 * 1024,
	});

	// ESLint exits 1 when errors are present but still writes JSON to stdout, so
	// we parse stdout regardless of the exit code and only bail on a genuine
	// failure to produce output.
	const stdout = result.stdout ? result.stdout.trim() : '';
	if (!stdout) {
		const detail = (result.stderr || '').trim() || `exit code ${result.status}`;
		throw new Error(`Unable to lint ${dir}: ${detail}`);
	}

	let files;
	try {
		files = JSON.parse(stdout);
	} catch {
		throw new Error(`Unable to parse ESLint JSON output for ${dir}`);
	}

	let warnings = 0;
	let errors = 0;
	for (const file of files) {
		warnings += file.warningCount;
		errors += file.errorCount;
	}
	return { warnings, errors };
}

function loadBaseline() {
	if (!fs.existsSync(baselineFile)) return null;
	const parsed = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
	return parsed.budgets || {};
}

function writeBaseline(budgets) {
	const ordered = {};
	for (const key of Object.keys(budgets).sort()) ordered[key] = budgets[key];
	const payload = {
		description:
			'Per-package ESLint warning budget enforced by scripts/lint-budget.js. ' +
			'A package that emits more warnings than its budget fails CI. Lower a ' +
			'budget with `pnpm run lint:budget -- --update` after removing warnings; ' +
			'never raise one to hide a new warning.',
		budgets: ordered,
	};
	fs.writeFileSync(baselineFile, `${JSON.stringify(payload, null, '\t')}\n`);
}

function pad(value, width) {
	return String(value).padStart(width);
}

function main() {
	const dirs = workspaces();
	const current = {};
	let totalWarnings = 0;
	let totalErrors = 0;

	for (const dir of dirs) {
		const posix = toPosix(dir);
		process.stderr.write(`linting ${posix} ...\n`);
		const { warnings, errors } = lintWorkspace(dir);
		current[posix] = warnings;
		totalWarnings += warnings;
		totalErrors += errors;
	}

	const baseline = loadBaseline();

	if (isUpdate) {
		const next = {};
		for (const [pkg, count] of Object.entries(current)) {
			const prior = baseline ? baseline[pkg] : undefined;
			if (prior === undefined || allowRaise) {
				next[pkg] = count;
			} else {
				next[pkg] = Math.min(prior, count);
			}
		}
		writeBaseline(next);
		console.info(
			`Wrote ${path.basename(baselineFile)} for ${Object.keys(next).length} packages` +
				`${allowRaise ? '' : ' (ratchet-down only)'}.`,
		);
		return;
	}

	if (!baseline) {
		console.error(
			`No ${path.basename(baselineFile)} found. Generate it with: ` +
				'pnpm run lint:budget -- --update --allow-raise',
		);
		process.exit(1);
	}

	const rows = [];
	const overBudget = [];
	const improved = [];
	const packages = new Set([...Object.keys(baseline), ...Object.keys(current)]);

	for (const pkg of [...packages].sort()) {
		const budget = baseline[pkg] ?? 0;
		const now = current[pkg] ?? 0;
		const delta = now - budget;
		rows.push({ pkg, budget, now, delta });
		if (delta > 0) overBudget.push({ pkg, budget, now, delta });
		if (delta < 0) improved.push({ pkg, budget, now, delta });
	}

	const nameWidth = Math.max(...rows.map(row => row.pkg.length), 'package'.length);
	console.info(
		`${'package'.padEnd(nameWidth)}  ${pad('budget', 8)}  ${pad('current', 8)}  ${pad('delta', 7)}`,
	);
	console.info('-'.repeat(nameWidth + 2 + 8 + 2 + 8 + 2 + 7));
	for (const { pkg, budget, now, delta } of rows) {
		const mark = delta > 0 ? ' <- OVER BUDGET' : '';
		const deltaStr = delta > 0 ? `+${delta}` : String(delta);
		console.info(
			`${pkg.padEnd(nameWidth)}  ${pad(budget, 8)}  ${pad(now, 8)}  ${pad(deltaStr, 7)}${mark}`,
		);
	}
	console.info('-'.repeat(nameWidth + 2 + 8 + 2 + 8 + 2 + 7));
	console.info(
		`${'TOTAL'.padEnd(nameWidth)}  ${pad(
			rows.reduce((sum, row) => sum + row.budget, 0),
			8,
		)}  ${pad(totalWarnings, 8)}`,
	);

	if (totalErrors > 0) {
		console.info(
			`\nNote: ESLint also reported ${totalErrors} error(s); those are gated separately by \`pnpm run lint\`.`,
		);
	}

	if (improved.length > 0 && overBudget.length === 0) {
		console.info(
			`\n${improved.length} package(s) are now UNDER budget. Ratchet the baseline down with: ` +
				'pnpm run lint:budget -- --update',
		);
	}

	if (overBudget.length > 0) {
		console.error(
			`\nLint budget exceeded in ${overBudget.length} package(s):`,
		);
		for (const { pkg, budget, now, delta } of overBudget) {
			console.error(`  ${pkg}: ${now} warnings > budget ${budget} (+${delta})`);
		}
		console.error(
			'\nNew ESLint warnings were introduced. Fix them, or if they are ' +
				'unavoidable and reviewed, raise the budget deliberately in ' +
				`${path.basename(baselineFile)}.`,
		);
		process.exit(1);
	}

	console.info('\nLint budget check passed.');
}

main();
