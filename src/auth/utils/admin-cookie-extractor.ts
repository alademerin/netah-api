import { Request } from 'express';

export const adminCookieExtractor = (req: Request): string | null => {
  let token: string | null = null;

  // Try to extract from cookie first
  if (req && req.cookies) {
    token = req.cookies['admin_token'];
  }

  // If no cookie, try Authorization header (for mobile/API clients)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  return token;
};
