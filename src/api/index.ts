import { Router } from 'express';
import User from './routes/User';
import Teacher from './routes/Teacher';
import Session from './routes/Session';

/**
 * Aggregates all feature routers into a single router, mounted by the Server
 * under config.api.prefix.
 */
export default (): Router => {
  const app = Router();

  User(app);
  Teacher(app);
  Session(app);

  return app;
};
