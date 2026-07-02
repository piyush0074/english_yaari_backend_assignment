import { Server } from '../../loaders/Server';
import config from '../../config';
import { ITeacher } from '../../Model/Teacher';
import { ICreateTeacherParams } from '../../interface/IAPIParams';

/**
 * Business logic for teachers. Used both by the create-teacher helper endpoint
 * and by SessionService when validating that a session's teacher exists.
 */
export class TeacherService {
  private get db() {
    return Server.instance.mongodb;
  }

  async createTeacher(params: ICreateTeacherParams): Promise<ITeacher> {
    return this.db.create<ITeacher>(config.mongo.models.Teacher, params);
  }

  async teacherExists(teacherId: string): Promise<boolean> {
    return this.db.exists<ITeacher>(config.mongo.models.Teacher, { _id: teacherId });
  }
}
