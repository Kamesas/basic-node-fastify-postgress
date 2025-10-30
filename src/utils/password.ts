import argon2 from "argon2";
import { config } from "../config";

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: config.argonMemoryCost,
    timeCost: config.argonTimeCost,
    parallelism: config.argonParallelism,
  });
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};
