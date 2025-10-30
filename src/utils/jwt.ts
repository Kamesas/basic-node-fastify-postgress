import jwt from "jsonwebtoken";
import { config } from "../config";

export type tJwtPayload = {
  userId: number;
  username: string;
  email?: string;
};

export type tJwtVerifyResult = tJwtPayload & {
  iat: number;
  exp: number;
};

const generateToken = (payload: tJwtPayload, expiresIn: string): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const generateAccessToken = (payload: tJwtPayload): string => {
  return generateToken(payload, config.jwtAccessExpiry);
};

export const generateRefreshToken = (payload: tJwtPayload): string => {
  return generateToken(payload, config.jwtRefreshExpiry);
};

export const verifyToken = (token: string): tJwtVerifyResult => {
  try {
    return jwt.verify(token, config.jwtSecret) as tJwtVerifyResult;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
};
