import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import logger from './Logger';
import { MongoDB } from './MongoDB';
import config from '../config';
import routes from '../api';
import {
  ApiError,
  BadRequestError,
  ConflictError,
  InternalError,
  NotFoundError,
} from '../core/APIerror';

/**
 * Application server, held as a singleton so controllers/services can reach
 * shared infrastructure (the DB loader) via `Server.instance.mongodb`.
 * `start()` initializes the database, wires middleware and routes, mounts the
 * centralized error handler, and begins listening.
 */
export class Server {
  static instance: Server;

  static getInstance(app: Express, mongodb: MongoDB): Server {
    if (!Server.instance) {
      Server.instance = new Server(app, mongodb);
    }
    return Server.instance;
  }

  private constructor(public app: Express, public mongodb: MongoDB) {}

  async start(): Promise<void> {
    await this.mongodb.initialize();

    this.app.use(cors(this.corsOptions()));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(this.requestId);

    // Liveness probe.
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ success: true, status: 'ok', version: config.version });
    });

    // Feature routes under the configured prefix.
    this.app.use(config.api.prefix, routes());
    logger.info('Routes initialized.');

    // Unknown route -> 404, forwarded to the error handler.
    this.app.use((_req: Request, _res: Response, next: NextFunction) => next(new NotFoundError()));

    // Centralized error handler (must be last).
    this.app.use(this.errorHandler);

    this.app.listen(config.port, () => {
      logger.info(`Server listening on http://localhost:${config.port} [${config.environment}]`);
    });
  }

  private corsOptions(): cors.CorsOptions {
    const { allowedOrigins, credentials, methods } = config.cors;
    return {
      origin: allowedOrigins.includes('*') ? true : allowedOrigins,
      credentials,
      methods,
    };
  }

  private readonly requestId = (req: Request, res: Response, next: NextFunction): void => {
    req.id = uuidv4();
    res.setHeader('x-request-id', req.id);
    next();
  };

  /**
   * Translates every error into a uniform ApiResponse. Known ApiErrors are
   * mapped by type; Mongoose validation/cast/duplicate-key errors are converted
   * to the appropriate ApiError; anything else becomes a 500.
   */
  private readonly errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
  ): Response => {
    const mapped = Server.normalize(err);

    if (mapped.type === 'internal') {
      logger.error(`Unhandled error: ${mapped.error.message}`);
      if (mapped.error.stack) logger.error(mapped.error.stack);
    }

    return ApiError.handle(mapped.apiError, res);
  };

  private static normalize(
    err: unknown
  ): { apiError: ApiError; type: 'known' | 'internal'; error: Error } {
    if (err instanceof ApiError) {
      return { apiError: err, type: 'known', error: err };
    }
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)
        .map((e) => e.message)
        .join('; ');
      return { apiError: new BadRequestError(message), type: 'known', error: err };
    }
    if (err instanceof mongoose.Error.CastError) {
      return {
        apiError: new BadRequestError(`Invalid value for '${err.path}'`),
        type: 'known',
        error: err,
      };
    }
    if (Server.isDuplicateKey(err)) {
      const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
      return {
        apiError: new ConflictError(`Duplicate value for '${field}'. It must be unique.`),
        type: 'known',
        error: err as unknown as Error,
      };
    }
    const error = err instanceof Error ? err : new Error(String(err));
    const message = config.environment === 'production' ? 'Something went wrong.' : error.message;
    return { apiError: new InternalError(message), type: 'internal', error };
  }

  private static isDuplicateKey(
    err: unknown
  ): err is { code: number; keyValue?: Record<string, unknown> } {
    return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
  }
}
