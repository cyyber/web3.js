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
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(__dirname, '..', '..', '..');
const workspaceRoots = ['packages', 'tools'];

interface Manifest {
	name?: string;
	version?: string;
	private?: boolean;
	publishConfig?: { access?: string };
	engines?: Record<string, string>;
}

const readManifest = (manifestPath: string): Manifest =>
	JSON.parse(readFileSync(join(root, manifestPath), 'utf8')) as Manifest;

const manifestPaths = (): string[] =>
	workspaceRoots.flatMap(workspaceRoot => {
		const absoluteRoot = join(root, workspaceRoot);
		if (!existsSync(absoluteRoot)) return [];

		return readdirSync(absoluteRoot, { withFileTypes: true })
			.filter(entry => entry.isDirectory())
			.map(entry => `${workspaceRoot}/${entry.name}/package.json`)
			.filter(manifestPath => existsSync(join(root, manifestPath)));
	});

// Mirrors the publishable predicate in scripts/release/packages.js: anything
// npm actually ships must advertise the same floor.
const publishableManifestPaths = (): string[] =>
	manifestPaths()
		.filter(manifestPath => {
			const manifest = readManifest(manifestPath);
			return (
				Boolean(manifest.name) &&
				Boolean(manifest.version) &&
				manifest.private !== true &&
				manifest.publishConfig?.access === 'public'
			);
		})
		.sort();

describe('Publishable package engine metadata', () => {
	const rootEngine = readManifest('package.json').engines?.node;
	const publishable = publishableManifestPaths();

	it('should declare engines.node in the root manifest', () => {
		expect(rootEngine).toBeDefined();
	});

	it('should discover the publishable workspace packages', () => {
		expect(publishable.length).toBeGreaterThan(0);
	});

	it.each(publishable)('%s should declare engines.node matching the root manifest', manifestPath => {
		expect(readManifest(manifestPath).engines?.node).toBe(rootEngine);
	});

	it('should declare a single engines.node floor across every publishable manifest', () => {
		const declared = new Map<string, string[]>();

		for (const manifestPath of ['package.json', ...publishable]) {
			const engine = readManifest(manifestPath).engines?.node ?? '<missing>';
			declared.set(engine, [...(declared.get(engine) ?? []), manifestPath]);
		}

		// Surfaces every divergent manifest at once instead of only the first.
		expect(Object.fromEntries(declared)).toEqual({ [String(rootEngine)]: ['package.json', ...publishable] });
	});

	it('should not declare an npm engine on any publishable manifest', () => {
		for (const manifestPath of publishable) {
			expect(readManifest(manifestPath).engines?.npm).toBeUndefined();
		}
	});
});
