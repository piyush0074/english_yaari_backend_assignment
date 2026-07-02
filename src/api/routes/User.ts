import { Request, Response, Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { CreateUser } from '../../controller/user/CreateUser';
import { GetUserSessions } from '../../controller/user/GetUserSessions';
import { CreateUserValidation, UserIdParamValidation } from '../middleware/Validation';

const route = Router();

export default (app: Router): void => {
  app.use('/users', route);

  const createUser = new CreateUser();
  const getUserSessions = new GetUserSessions();

  // API 1 — Create User
  route.post(
    '/',
    CreateUserValidation,
    asyncHandler((req: Request, res: Response) => createUser.execute(req, res))
  );

  // API 6 — User Session List (Upcoming + Completed)
  route.get(
    '/:id/sessions',
    UserIdParamValidation,
    asyncHandler((req: Request, res: Response) => getUserSessions.execute(req, res))
  );
};
