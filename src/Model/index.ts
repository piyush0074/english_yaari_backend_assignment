import { UserModel } from './User';
import { TeacherModel } from './Teacher';
import { SessionModel } from './Session';

/**
 * Registers every Mongoose model with the connection. Called once by the
 * MongoDB loader during initialization, mirroring how the reference PostgreSQL
 * loader syncs its models on startup.
 */
export const registerModels = (): void => {
  UserModel();
  TeacherModel();
  SessionModel();
};
