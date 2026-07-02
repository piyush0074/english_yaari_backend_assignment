import config from '../../config';
import { MongoDB } from '../../loaders/MongoDB';
import { IUser } from '../../Model/User';
import { IUserRepository } from '../interfaces/IUserRepository';

export class MongoUserRepository implements IUserRepository {
  constructor(private readonly db: MongoDB) {}

  async existsById(userId: string): Promise<boolean> {
    return this.db.exists<IUser>(config.mongo.models.User, { _id: userId });
  }
}
