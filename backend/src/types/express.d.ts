import { AuthContext } from '../auth/types';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      csrfToken(): string;
    }
  }
}

export {};
