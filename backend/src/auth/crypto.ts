import { createHash, randomInt, randomBytes, timingSafeEqual } from 'crypto';

const createOpaqueToken = () => randomBytes(32).toString('base64url');
const createNumericCode = (digits = 6): string => {
  const max = 10 ** digits;
  return String(randomInt(0, max)).padStart(digits, '0');
};

const hashOpaqueToken = (token: string) => createHash('sha256').update(token, 'utf8').digest('hex');

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
