type IllustryErrorDetails = Record<string, unknown>;

class IllustryError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: IllustryErrorDetails;

  constructor(message: string, options: {
    code?: string;
    status?: number;
    details?: IllustryErrorDetails;
    cause?: unknown;
  } = {}) {
    super(message);
    this.name = 'IllustryError';
    this.code = options.code || 'ILLUSTRY_ERROR';
    this.status = options.status;
    this.details = options.details;
    if (options.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        configurable: true,
        enumerable: false,
        value: options.cause,
        writable: true
      });
    }
  }
}

const toIllustryError = (error: unknown, fallbackMessage = 'Illustry operation failed.') => {
  if (error instanceof IllustryError) {
    return error;
  }
  if (error instanceof Error) {
    return new IllustryError(error.message || fallbackMessage, {
      code: 'ILLUSTRY_OPERATION_FAILED',
      cause: error
    });
  }
  return new IllustryError(fallbackMessage, {
    code: 'ILLUSTRY_OPERATION_FAILED',
    details: { value: error }
  });
};

export {
  IllustryError,
  toIllustryError
};
export type {
  IllustryErrorDetails
};
