import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { BadRequestResponse } from '../../core/APIresponse';

/** Reusable Joi rule for a Mongo ObjectId (24-hex string). */
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.isValidObjectId(value)) return helpers.error('any.invalid');
  return value;
}, 'ObjectId');

/**
 * Builds a middleware that validates a chosen part of the request against a Joi
 * schema, returning a uniform 400 on failure. Centralizing validation here keeps
 * controllers focused on orchestration.
 */
const validate =
  (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query') =>
  (req: Request, res: Response, next: NextFunction): void | Response => {
    const { error } = schema.validate(req[property], { abortEarly: true });
    if (error) return new BadRequestResponse(error.details[0].message).send(res);
    next();
  };

/* --------------------------------- Users --------------------------------- */

export const CreateUserValidation = validate(
  Joi.object({
    fullName: Joi.string().trim().min(1).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().min(1).required(),
  }),
  'body'
);

export const UserIdParamValidation = validate(
  Joi.object({ id: objectId.required() }),
  'params'
);

/* -------------------------------- Teachers -------------------------------- */

export const CreateTeacherValidation = validate(
  Joi.object({
    fullName: Joi.string().trim().min(1).required(),
    email: Joi.string().trim().email().required(),
    specialization: Joi.string().trim().min(1).required(),
    experience: Joi.number().min(0).required(),
  }),
  'body'
);

/* -------------------------------- Sessions -------------------------------- */

export const CreateSessionValidation = validate(
  Joi.object({
    teacherId: objectId.required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
  }),
  'body'
);

export const SessionIdParamValidation = validate(
  Joi.object({ id: objectId.required() }),
  'params'
);

export const BookSessionValidation = validate(
  Joi.object({ userId: objectId.required() }),
  'body'
);

