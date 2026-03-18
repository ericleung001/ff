import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

export async function verify(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  const verifyHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  } catch {
    return false;
  }
}
