import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { Role } from '../types/roles';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  hospitalId?: string | null;
  branchId?: string | null;
  jti?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomUUID(),
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomUUID(),
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;
};

