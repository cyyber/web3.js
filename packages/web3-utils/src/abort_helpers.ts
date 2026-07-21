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

import { RequestTimeoutError } from '@theqrl/web3-errors';
import { validateTimeout } from './provider_bounds.js';

/**
 * Options for {@link composeAbortSignal}.
 */
export interface ComposeAbortSignalOptions {
	/**
	 * Deadline in milliseconds, after which the composed signal aborts. Must be finite
	 * and greater than 0 (see {@link validateTimeout}). Omit for no internal deadline.
	 */
	timeout?: number;
	/**
	 * Caller-supplied signal. When it aborts, the composed signal aborts with the same
	 * reason.
	 */
	signal?: AbortSignal;
	/**
	 * Lazily builds the abort reason used when the deadline fires. Called at most once,
	 * only on timeout. Defaults to a {@link RequestTimeoutError}.
	 */
	timeoutReason?: () => unknown;
}

/**
 * The result of {@link composeAbortSignal}.
 */
export interface AbortComposition {
	/**
	 * The composed signal. Aborts when either the caller's signal aborts or the deadline
	 * fires, whichever happens first.
	 */
	readonly signal: AbortSignal;
	/**
	 * `true` only when the internal deadline fired. Lets callers distinguish a timeout
	 * from a caller-initiated cancellation, which abort reasons alone cannot always do.
	 */
	readonly timedOut: boolean;
	/**
	 * Releases the timer and the listener on the caller's signal. Idempotent, and safe to
	 * call after the composed signal has already aborted. Never itself aborts.
	 *
	 * Call this from a `finally` block on every terminal path.
	 */
	dispose(): void;
}

/**
 * Composes a caller-supplied `AbortSignal` with an internally-created deadline.
 *
 * Both the HTTP and socket providers use this so that cancellation and timeout semantics
 * are identical across transports. The returned {@link AbortComposition.dispose} clears
 * the deadline timer and detaches the listener from the caller's signal; it runs
 * automatically when the composed signal aborts, so no path leaks a timer or a listener.
 *
 * Uses only `AbortController` / `AbortSignal`, so it works on Node 20.19+ and modern
 * browsers with no dependency on `AbortSignal.any` or `AbortSignal.timeout`.
 *
 * @param options - see {@link ComposeAbortSignalOptions}
 * @returns the composed signal, a `timedOut` flag and a `dispose` function
 * @example
 * ```ts
 * const { signal, timedOut, dispose } = composeAbortSignal({
 * 	timeout: 120_000,
 * 	signal: callerSignal,
 * });
 * try {
 * 	return await fetch(url, { signal });
 * } catch (error) {
 * 	if (timedOut) throw new RequestTimeoutError(120_000);
 * 	throw error;
 * } finally {
 * 	dispose();
 * }
 * ```
 */
export const composeAbortSignal = ({
	timeout,
	signal,
	timeoutReason,
}: ComposeAbortSignalOptions = {}): AbortComposition => {
	const controller = new AbortController();
	const cleanups: (() => void)[] = [];

	let timedOut = false;
	let disposed = false;

	const dispose = () => {
		if (disposed) return;
		disposed = true;

		while (cleanups.length > 0) {
			(cleanups.pop() as () => void)();
		}
	};

	if (timeout !== undefined) {
		validateTimeout(timeout, 'timeout');

		const timer = setTimeout(() => {
			timedOut = true;
			controller.abort(timeoutReason ? timeoutReason() : new RequestTimeoutError(timeout));
			dispose();
		}, timeout);

		// A pending deadline must not, by itself, keep a Node process alive.
		if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
			(timer as unknown as { unref: () => void }).unref();
		}

		cleanups.push(() => clearTimeout(timer));
	}

	if (signal !== undefined) {
		if (signal.aborted) {
			controller.abort(signal.reason);
			// Drops the timer armed above, if any.
			dispose();
		} else {
			const onAbort = () => {
				controller.abort(signal.reason);
				dispose();
			};

			signal.addEventListener('abort', onAbort, { once: true });
			cleanups.push(() => signal.removeEventListener('abort', onAbort));
		}
	}

	return {
		signal: controller.signal,
		get timedOut() {
			return timedOut;
		},
		dispose,
	};
};
