import { Request, Response, Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { CreateSession } from '../../controller/session/CreateSession';
import { AvailableSessions } from '../../controller/session/AvailableSessions';
import { BookSession } from '../../controller/session/BookSession';
import { CompleteSession } from '../../controller/session/CompleteSession';
import {
  CreateSessionValidation,
  SessionIdParamValidation,
  BookSessionValidation,
} from '../middleware/Validation';
import { SessionService } from '../../controller/service/SessionService';
import { Server } from '../../loaders/Server';
import { MongoSessionRepository } from '../../repository/mongo/MongoSessionRepository';
import { MongoUserRepository } from '../../repository/mongo/MongoUserRepository';
import { MongoTeacherRepository } from '../../repository/mongo/MongoTeacherRepository';

const route = Router();

export default (app: Router): void => {
  app.use('/sessions', route);

  const db = Server.instance.mongodb;
  const sessionRepository = new MongoSessionRepository(db);
  const userRepository = new MongoUserRepository(db);
  const teacherRepository = new MongoTeacherRepository(db);
  const sessionService = new SessionService(sessionRepository, userRepository, teacherRepository);

  const createSession = new CreateSession(sessionService);
  const availableSessions = new AvailableSessions(sessionService);
  const bookSession = new BookSession(sessionService);
  const completeSession = new CompleteSession(sessionService);

  // API 3 — Available Sessions (specific path, declared before parameterized routes)
  route.get(
    '/available',
    asyncHandler((req: Request, res: Response) => availableSessions.execute(req, res))
  );

  // API 2 — Create Session
  route.post(
    '/',
    CreateSessionValidation,
    asyncHandler((req: Request, res: Response) => createSession.execute(req, res))
  );

  // API 4 — Book Session
  route.post(
    '/:id/book',
    SessionIdParamValidation,
    BookSessionValidation,
    asyncHandler((req: Request, res: Response) => bookSession.execute(req, res))
  );

  // API 5 — Mark Session Complete
  route.patch(
    '/:id/complete',
    SessionIdParamValidation,
    asyncHandler((req: Request, res: Response) => completeSession.execute(req, res))
  );
};
