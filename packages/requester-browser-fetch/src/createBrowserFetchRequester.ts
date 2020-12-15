// eslint-disable-next-line import/no-unresolved
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

import { Request, Requester, Response } from '@algolia/requester-common';

export const createBrowserFetchRequester = (): Requester => ({
  send(request: Request): Readonly<Promise<Response>> {
    const controller = new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(
      () => controller.abort(),
      (request.connectTimeout + request.responseTimeout) * 1000
    );

    return fetch(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      signal,
    })
      .then(response => {
        return response.text().then(text => ({
          content: text,
          status: response.status,
          isTimedOut: false,
        }));
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          return {
            content: 'Request timeout',
            status: 0,
            isTimedOut: true,
          };
        } else {
          return {
            content: 'Network request failed',
            status: 0,
            isTimedOut: false,
          };
        }
      })
      .then(result => {
        clearTimeout(timer);

        return result;
      });
  },
});
