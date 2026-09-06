import { Request } from 'express';

export const cookieExtractor = (req: Request) => {
  let token = null;

  // Try to extract from cookie first
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }

  // If no cookie, try Authorization header (for mobile/incognito clients)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  return token;
};
