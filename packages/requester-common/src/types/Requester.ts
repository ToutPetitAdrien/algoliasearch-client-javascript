import { Request, Response } from '.';

export type Requester = {
  /**
   * Sends the given `request` to the server.
   */
  readonly send: (request: Request) => Readonly<Promise<Response>>;
};

export type Requester2 = {
  /**
   * Sends the given `request` to the server.
   */
  readonly send: (request: Request) => Readonly<Promise<void | Response>>;
};
