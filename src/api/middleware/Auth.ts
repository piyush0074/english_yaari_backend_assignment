import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthFailureResponse, ForbiddenResponse } from '../../core/APIresponse';
import { ActorRole } from '../../core/types';
import { Server } from '../../loaders/Server';
import config from '../../config';
import { IUser } from '../../Model/User';
import { ITeacher } from '../../Model/Teacher';

const ALLOWED_ROLES: readonly ActorRole[] = ['TEACHER', 'STUDENT'];

const parseRole = (value: string | undefined): ActorRole | null => {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return ALLOWED_ROLES.includes(normalized as ActorRole) ? (normalized as ActorRole) : null;
};

/**
 * Simple actor-auth middleware for this assignment.
 *
 * Required headers:
 * - x-actor-id: Mongo ObjectId of caller
 * - x-actor-role: TEACHER | STUDENT
 */
export const requireAuth =
  (requiredRole?: ActorRole) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const actorId = (req.header('x-actor-id') ?? '').trim();
    const role = parseRole(req.header('x-actor-role'));

    if (!actorId || !role) {
      return new AuthFailureResponse(
        'Authentication required via x-actor-id and x-actor-role headers'
      ).send(res);
    }

    if (!mongoose.isValidObjectId(actorId)) {
      return new AuthFailureResponse('x-actor-id must be a valid ObjectId').send(res);
    }

    const db = Server.instance.mongodb;
    const exists =
      role === 'TEACHER'
        ? await db.exists<ITeacher>(config.mongo.models.Teacher, { _id: actorId })
        : await db.exists<IUser>(config.mongo.models.User, { _id: actorId });

    if (!exists) {
      return new AuthFailureResponse(`${role} not found for supplied x-actor-id`).send(res);
    }

    if (requiredRole && role !== requiredRole) {
      return new ForbiddenResponse(`Only ${requiredRole}s can access this endpoint`).send(res);
    }

    req.auth = { actorId, role };
    next();
  };
