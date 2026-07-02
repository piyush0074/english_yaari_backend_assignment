import config from '../../config';
import { MongoDB } from '../../loaders/MongoDB';
import { ITeacher } from '../../Model/Teacher';
import { ITeacherRepository } from '../interfaces/ITeacherRepository';

export class MongoTeacherRepository implements ITeacherRepository {
  constructor(private readonly db: MongoDB) {}

  async existsById(teacherId: string): Promise<boolean> {
    return this.db.exists<ITeacher>(config.mongo.models.Teacher, { _id: teacherId });
  }
}
