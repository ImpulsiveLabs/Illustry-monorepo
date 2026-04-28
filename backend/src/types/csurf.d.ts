declare module 'csurf' {
  import type { RequestHandler } from 'express';

  type CookieOptions = boolean | {
    key?: string;
    path?: string;
    signed?: boolean;
    secure?: boolean;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
  };

  type CsrfOptions = {
    cookie?: CookieOptions;
    ignoreMethods?: string[];
    sessionKey?: string;
    value?: (request: Express.Request) => string;
  };

  function csrf(options?: CsrfOptions): RequestHandler;

  export = csrf;
}
