import { Request, Response, Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { CreateTeacher } from '../../controller/teacher/CreateTeacher';
import { CreateTeacherValidation } from '../middleware/Validation';

const route = Router();

export default (app: Router): void => {
  app.use('/teachers', route);

  const createTeacher = new CreateTeacher();

  // Helper — Create Teacher (seed teachers for session creation)
  route.post(
    '/',
    CreateTeacherValidation,
    asyncHandler((req: Request, res: Response) => createTeacher.execute(req, res))
  );
};
