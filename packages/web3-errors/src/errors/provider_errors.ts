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

/* eslint-disable max-classes-per-file */

import {
	ERR_PROVIDER,
	ERR_INVALID_PROVIDER,
	ERR_INVALID_CLIENT,
	ERR_SUBSCRIPTION,
	ERR_WS_PROVIDER,
	ERR_REQUEST_TIMEOUT,
	ERR_REQUEST_QUEUE_FULL,
	ERR_PROVIDER_CAPABILITY,
} from '../error_codes.js';
import { BaseWeb3Error } from '../web3_error_base.js';

export class ProviderError extends BaseWeb3Error {
	public code = ERR_PROVIDER;
}

export class InvalidProviderError extends BaseWeb3Error {
	public code = ERR_INVALID_PROVIDER;

	public constructor(public clientUrl: string) {
		super(`Provider with url "${clientUrl}" is not set or invalid`);
	}
}

export class InvalidClientError extends BaseWeb3Error {
	public code = ERR_INVALID_CLIENT;

	public constructor(clientUrl: string) {
		super(`Client URL "${clientUrl}" is invalid.`);
	}
}

export class SubscriptionError extends BaseWeb3Error {
	public code = ERR_SUBSCRIPTION;
}

export class Web3WSProviderError extends BaseWeb3Error {
	public code = ERR_WS_PROVIDER; // this had duplicate code with generic provider
}

/**
 * Thrown when a JSON-RPC request exceeds its total deadline (`requestTimeout`).
 *
 * This covers the whole request lifetime, including any time spent waiting for a
 * connection to become available. It is distinct from {@link ConnectionTimeoutError},
 * which only bounds the connect/handshake phase.
 */
export class RequestTimeoutError extends ProviderError {
	public code = ERR_REQUEST_TIMEOUT;

	public constructor(public duration: number, public method?: string) {
		super(
			`REQUEST TIMEOUT: request${
				method ? ` "${method}"` : ''
			} exceeded the ${duration}ms deadline`,
		);
	}

	public toJSON() {
		return { ...super.toJSON(), duration: this.duration, method: this.method };
	}
}

/**
 * Thrown when a provider already has `maxInFlightRequests` requests outstanding.
 *
 * This error is retryable: the condition is transient backpressure, not a bad request.
 * Callers should back off and retry rather than treating it as a permanent failure.
 */
export class RequestQueueFullError extends ProviderError {
	public code = ERR_REQUEST_QUEUE_FULL;
	public readonly retryable = true;

	public constructor(public maxInFlightRequests: number) {
		super(
			`REQUEST QUEUE FULL: provider already has ${maxInFlightRequests} in-flight requests (maxInFlightRequests). Retry after pending requests settle.`,
		);
	}

	public toJSON() {
		return {
			...super.toJSON(),
			maxInFlightRequests: this.maxInFlightRequests,
			retryable: this.retryable,
		};
	}
}

/**
 * Thrown when the runtime or an injected dependency cannot provide a capability that
 * is required to enforce a safety bound, so the provider fails closed rather than
 * silently dropping the bound.
 *
 * The motivating case: a custom `fetch` returns a non-empty response with no readable
 * body stream, which makes it impossible to enforce `maxResponseBytes` incrementally.
 * Falling back to an unbounded `response.text()` would defeat the bound entirely.
 */
export class ProviderCapabilityError extends ProviderError {
	public code = ERR_PROVIDER_CAPABILITY;

	public constructor(public capability: string, reason?: string) {
		super(
			`PROVIDER CAPABILITY MISSING: "${capability}" is required but unavailable${
				reason ? `: ${reason}` : ''
			}. Refusing to continue without it.`,
		);
	}

	public toJSON() {
		return { ...super.toJSON(), capability: this.capability };
	}
}
