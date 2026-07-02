import { Response } from 'express';
import {
  AuthFailureResponse,
  BadRequestResponse,
  ConflictResponse,
  ForbiddenResponse,
  InternalErrorResponse,
  NotFoundResponse,
} from './APIresponse';

enum ErrorType {
  BAD_REQUEST = 'BadRequestError',
  UNAUTHORIZED = 'AuthFailureError',
  FORBIDDEN = 'ForbiddenError',
  NOT_FOUND = 'NotFoundError',
  CONFLICT = 'ConflictError',
  INTERNAL = 'InternalError',
}

/**
 * Base application error. Controllers/services throw one of the subclasses for
 * expected failure cases; the Server's error middleware calls `ApiError.handle`
 * to translate the error into the matching ApiResponse. This is the single
 * place where error type -> HTTP response mapping lives.
 */
export abstract class ApiError extends Error {
  protected constructor(public type: ErrorType, public message: string = 'error') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static handle(err: ApiError, res: Response): Response {
    switch (err.type) {
      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);
      case ErrorType.UNAUTHORIZED:
        return new AuthFailureResponse(err.message).send(res);
      case ErrorType.FORBIDDEN:
        return new ForbiddenResponse(err.message).send(res);
      case ErrorType.NOT_FOUND:
        return new NotFoundResponse(err.message).send(res);
      case ErrorType.CONFLICT:
        return new ConflictResponse(err.message).send(res);
      default:
        return new InternalErrorResponse(err.message).send(res);
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export class AuthFailureError extends ApiError {
  constructor(message = 'Authentication failure') {
    super(ErrorType.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied') {
    super(ErrorType.FORBIDDEN, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(ErrorType.CONFLICT, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal error') {
    super(ErrorType.INTERNAL, message);
  }
}
