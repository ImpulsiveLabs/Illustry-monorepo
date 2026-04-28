class AuthHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const INVALID_AUTH_MESSAGE = 'Invalid email or password';
const GENERIC_IF_EXISTS_MESSAGE = 'If an account exists, an email was sent';

export {
  AuthHttpError,
  INVALID_AUTH_MESSAGE,
  GENERIC_IF_EXISTS_MESSAGE
};
