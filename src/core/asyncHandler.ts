import { Request, Response, NextFunction, RequestHandler } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async controller so any thrown/rejected error is forwarded to
 * Express's error pipeline (next(err)) and handled by the centralized error
 * middleware in Server. Lets controllers simply `throw new NotFoundError(...)`
 * instead of repeating try/catch.
 */
export const asyncHandler =
  (handler: Handler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
