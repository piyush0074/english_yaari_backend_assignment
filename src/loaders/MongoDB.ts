import mongoose, {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  PipelineStage,
  QueryOptions,
} from 'mongoose';
import logger from './Logger';
import config from '../config';
import { registerModels } from '../Model';

/**
 * MongoDB loader. Owns the single Mongoose connection and exposes a small,
 * typed data-access surface (create / findOne / findById / find /
 * findOneAndUpdate / exists / aggregate) so services depend on this loader
 * rather than importing Mongoose models directly. Mirrors the role the
 * PostgreSQL loader plays in the reference architecture.
 */
export class MongoDB {
  private connected = false;

  async initialize(): Promise<void> {
    if (this.connected) return;

    mongoose.set('strictQuery', true);
    registerModels();

    await mongoose.connect(config.mongo.uri);
    this.connected = true;

    const { host, name } = mongoose.connection;
    logger.info(`MongoDB connected: ${host}/${name}`);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await mongoose.disconnect();
    this.connected = false;
  }

  /** Resolves a registered model by name (from config.mongo.models). */
  public model<T extends Document>(name: string): Model<T> {
    return mongoose.model<T>(name);
  }

  public async create<T extends Document>(name: string, data: Partial<T>): Promise<T> {
    return this.model<T>(name).create(data);
  }

  public async findById<T extends Document>(name: string, id: string): Promise<T | null> {
    return this.model<T>(name).findById(id).exec();
  }

  public async findOne<T extends Document>(
    name: string,
    filter: FilterQuery<T>
  ): Promise<T | null> {
    return this.model<T>(name).findOne(filter).exec();
  }

  public async find<T extends Document>(
    name: string,
    filter: FilterQuery<T> = {}
  ): Promise<T[]> {
    return this.model<T>(name).find(filter).exec();
  }

  public async findOneAndUpdate<T extends Document>(
    name: string,
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    return this.model<T>(name).findOneAndUpdate(filter, update, options).exec();
  }

  public async exists<T extends Document>(
    name: string,
    filter: FilterQuery<T>
  ): Promise<boolean> {
    const doc = await this.model<T>(name).exists(filter).exec();
    return doc !== null;
  }

  public async aggregate<R = Record<string, unknown>>(
    name: string,
    pipeline: PipelineStage[]
  ): Promise<R[]> {
    return this.model(name).aggregate<R>(pipeline).exec();
  }
}
