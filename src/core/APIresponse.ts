import { Response } from 'express';

/**
 * HTTP status codes used across responses.
 */
enum ResponseStatus {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_ERROR = 500,
}

/**
 * Base response. Subclasses set the HTTP status; `.send(res)` serializes a
 * uniform JSON envelope ({ success, message, data? }). Centralizing this here
 * means controllers never build ad-hoc response bodies.
 */
abstract class ApiResponse {
  constructor(
    protected status: ResponseStatus,
    protected success: boolean,
    protected message: string
  ) {}

  protected prepare<T extends ApiResponse>(res: Response, response: T): Response {
    return res.status(this.status).json(ApiResponse.sanitize(response));
  }

  public send(res: Response): Response {
    return this.prepare<ApiResponse>(res, this);
  }

  /** Drops the internal `status` field and any undefined values from the body. */
  private static sanitize<T extends ApiResponse>(response: T): Record<string, unknown> {
    const clone: Record<string, unknown> = {};
    Object.assign(clone, response);
    delete clone.status;
    for (const key of Object.keys(clone)) {
      if (typeof clone[key] === 'undefined') delete clone[key];
    }
    return clone;
  }
}

/* ------------------------------- Success ------------------------------- */

export class SuccessResponse<T> extends ApiResponse {
  constructor(message: string, private data: T) {
    super(ResponseStatus.SUCCESS, true, message);
  }
}

export class CreatedResponse<T> extends ApiResponse {
  constructor(message: string, private data: T) {
    super(ResponseStatus.CREATED, true, message);
  }
}

export class SuccessMsgResponse extends ApiResponse {
  constructor(message: string) {
    super(ResponseStatus.SUCCESS, true, message);
  }
}

/* ------------------------------- Failure ------------------------------- */

export class BadRequestResponse extends ApiResponse {
  constructor(message = 'Bad Request') {
    super(ResponseStatus.BAD_REQUEST, false, message);
  }
}

export class AuthFailureResponse extends ApiResponse {
  constructor(message = 'Authentication Failure') {
    super(ResponseStatus.UNAUTHORIZED, false, message);
  }
}

export class ForbiddenResponse extends ApiResponse {
  constructor(message = 'Forbidden') {
    super(ResponseStatus.FORBIDDEN, false, message);
  }
}

export class NotFoundResponse extends ApiResponse {
  constructor(message = 'Not Found') {
    super(ResponseStatus.NOT_FOUND, false, message);
  }
}

export class ConflictResponse extends ApiResponse {
  constructor(message = 'Conflict') {
    super(ResponseStatus.CONFLICT, false, message);
  }
}

export class InternalErrorResponse extends ApiResponse {
  constructor(message = 'Internal Error') {
    super(ResponseStatus.INTERNAL_ERROR, false, message);
  }
}
