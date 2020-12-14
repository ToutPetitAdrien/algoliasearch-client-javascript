import { Request, Requester2, Response } from '@algolia/requester-common';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'

export function createBrowserFetchRequester(): Requester2 {
	return {
		send(request: Request): Readonly<Promise<void | Response>> {
			const controller = new AbortController()
			const signal = controller.signal;
			const timer = setTimeout(() => {
				controller.abort()
			}, (request.connectTimeout + request.responseTimeout) * 1000);
			return fetch(request.url, {
				method: request.method,
				headers: new Headers(request.headers),
				signal
			})
				.then(response => {
					clearTimeout(timer);
					return response
						.text()
						.then(text => ({
							content: text,
							status: response.status,
							isTimedOut: false,
						}));
				})
		}
	};
}
