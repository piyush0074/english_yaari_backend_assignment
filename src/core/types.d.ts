import 'express';

export type ActorRole = 'TEACHER' | 'STUDENT';

/**
 * Augments Express's Request with fields set by our middleware, so they are
 * strongly typed everywhere downstream.
 */
declare module 'express' {
  export interface Request {
    id?: string; // Per-request correlation id (set by requestId middleware).
    auth?: {
      actorId: string;
      role: ActorRole;
    };
  }
}
