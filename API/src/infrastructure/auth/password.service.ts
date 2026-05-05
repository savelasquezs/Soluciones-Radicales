import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (value: string): Promise<string> =>
  hash(value, SALT_ROUNDS);

export const comparePassword = async (
  plainText: string,
  passwordHash: string,
): Promise<boolean> => compare(plainText, passwordHash);
