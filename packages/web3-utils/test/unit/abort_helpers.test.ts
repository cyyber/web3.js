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

import { ProviderError, RequestTimeoutError } from '@theqrl/web3-errors';
import { composeAbortSignal } from '../../src/abort_helpers';

describe('abort_helpers', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('composeAbortSignal', () => {
		it('returns a non-aborted signal when given no options', () => {
			const { signal, timedOut, dispose } = composeAbortSignal();

			expect(signal.aborted).toBe(false);
			expect(timedOut).toBe(false);
			expect(() => dispose()).not.toThrow();
		});

		it('aborts with a RequestTimeoutError once the deadline elapses', () => {
			const composition = composeAbortSignal({ timeout: 1000 });

			expect(composition.signal.aborted).toBe(false);
			expect(composition.timedOut).toBe(false);

			jest.advanceTimersByTime(999);
			expect(composition.signal.aborted).toBe(false);

			jest.advanceTimersByTime(1);
			expect(composition.signal.aborted).toBe(true);
			expect(composition.timedOut).toBe(true);
			expect(composition.signal.reason).toBeInstanceOf(RequestTimeoutError);
			expect((composition.signal.reason as RequestTimeoutError).duration).toBe(1000);
		});

		it('uses a caller-supplied timeoutReason, built lazily', () => {
			const reason = new Error('custom deadline');
			const timeoutReason = jest.fn().mockReturnValue(reason);

			const composition = composeAbortSignal({ timeout: 500, timeoutReason });

			expect(timeoutReason).not.toHaveBeenCalled();

			jest.advanceTimersByTime(500);

			expect(timeoutReason).toHaveBeenCalledTimes(1);
			expect(composition.signal.reason).toBe(reason);
			expect(composition.timedOut).toBe(true);
		});

		it('propagates an external abort and its reason, without flagging a timeout', () => {
			const controller = new AbortController();
			const composition = composeAbortSignal({ timeout: 1000, signal: controller.signal });

			const reason = new Error('caller cancelled');
			controller.abort(reason);

			expect(composition.signal.aborted).toBe(true);
			expect(composition.signal.reason).toBe(reason);
			expect(composition.timedOut).toBe(false);
		});

		it('aborts immediately when the external signal is already aborted, and arms no timer', () => {
			const controller = new AbortController();
			const reason = new Error('already gone');
			controller.abort(reason);

			const composition = composeAbortSignal({ timeout: 1000, signal: controller.signal });

			expect(composition.signal.aborted).toBe(true);
			expect(composition.signal.reason).toBe(reason);
			expect(composition.timedOut).toBe(false);
			expect(jest.getTimerCount()).toBe(0);
		});

		it('honours whichever of deadline and external abort comes first', () => {
			const controller = new AbortController();
			const composition = composeAbortSignal({ timeout: 100, signal: controller.signal });

			jest.advanceTimersByTime(100);
			expect(composition.timedOut).toBe(true);

			// A later external abort must not overwrite the timeout reason.
			controller.abort(new Error('too late'));

			expect(composition.signal.reason).toBeInstanceOf(RequestTimeoutError);
			expect(composition.timedOut).toBe(true);
		});

		it('clears the deadline timer on dispose', () => {
			const composition = composeAbortSignal({ timeout: 1000 });
			expect(jest.getTimerCount()).toBe(1);

			composition.dispose();

			expect(jest.getTimerCount()).toBe(0);

			jest.advanceTimersByTime(10_000);
			expect(composition.signal.aborted).toBe(false);
			expect(composition.timedOut).toBe(false);
		});

		it('removes the listener from the external signal on dispose', () => {
			const controller = new AbortController();
			const removeEventListener = jest.spyOn(controller.signal, 'removeEventListener');

			const composition = composeAbortSignal({ signal: controller.signal });
			composition.dispose();

			expect(removeEventListener).toHaveBeenCalledTimes(1);

			// A post-dispose abort must not reach the composed signal.
			controller.abort(new Error('after dispose'));
			expect(composition.signal.aborted).toBe(false);
		});

		it('leaves no timer or listener behind after the deadline fires', () => {
			const controller = new AbortController();
			const removeEventListener = jest.spyOn(controller.signal, 'removeEventListener');

			composeAbortSignal({ timeout: 1000, signal: controller.signal });

			jest.advanceTimersByTime(1000);

			expect(jest.getTimerCount()).toBe(0);
			expect(removeEventListener).toHaveBeenCalledTimes(1);
		});

		it('leaves no timer or listener behind after an external abort', () => {
			const controller = new AbortController();
			const removeEventListener = jest.spyOn(controller.signal, 'removeEventListener');

			composeAbortSignal({ timeout: 1000, signal: controller.signal });

			controller.abort(new Error('cancelled'));

			expect(jest.getTimerCount()).toBe(0);
			expect(removeEventListener).toHaveBeenCalledTimes(1);
		});

		it('is idempotent on dispose and never aborts the signal itself', () => {
			const controller = new AbortController();
			const removeEventListener = jest.spyOn(controller.signal, 'removeEventListener');

			const composition = composeAbortSignal({ timeout: 1000, signal: controller.signal });

			composition.dispose();
			composition.dispose();
			composition.dispose();

			expect(removeEventListener).toHaveBeenCalledTimes(1);
			expect(jest.getTimerCount()).toBe(0);
			expect(composition.signal.aborted).toBe(false);
		});

		it('rejects a non-finite deadline rather than silently running unbounded', () => {
			expect(() => composeAbortSignal({ timeout: Infinity })).toThrow(ProviderError);
			expect(() => composeAbortSignal({ timeout: NaN })).toThrow(ProviderError);
			expect(() => composeAbortSignal({ timeout: 0 })).toThrow(ProviderError);
			expect(() => composeAbortSignal({ timeout: -1 })).toThrow(ProviderError);
		});
	});
});
