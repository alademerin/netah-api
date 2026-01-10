import { Request } from 'express';

export const cookieExtractor = (req: Request) => {
  if (!req || !req.cookies) return null;
  return req.cookies['access_token'];
};
