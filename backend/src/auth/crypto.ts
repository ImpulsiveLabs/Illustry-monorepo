import { pbkdf2Sync, randomInt, randomBytes, timingSafeEqual } from 'crypto';

const OPAQUE_TOKEN_HASH_SALT = 'auth:opaque-token:v1';
const OPAQUE_TOKEN_HASH_ITERATIONS = 210000;
const OPAQUE_TOKEN_HASH_KEYLEN = 32;

const createOpaqueToken = () => randomBytes(32).toString('base64url');
const createNumericCode = (digits = 6): string => {
  const max = 10 ** digits;
  return String(randomInt(0, max)).padStart(digits, '0');
};

const hashOpaqueToken = (token: string) => (
  pbkdf2Sync(
    token,
    OPAQUE_TOKEN_HASH_SALT,
    OPAQUE_TOKEN_HASH_ITERATIONS,
    OPAQUE_TOKEN_HASH_KEYLEN,
    'sha256'
  ).toString('hex')
);

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export {
  createOpaqueToken,
  createNumericCode,
  hashOpaqueToken,
  safeEqual
};
