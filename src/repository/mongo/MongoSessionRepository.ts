import { PipelineStage, Types } from 'mongoose';
import config from '../../config';
import { ICreateSessionParams } from '../../interface/IAPIParams';
import { ISession, SessionStatus } from '../../Model/Session';
import { MongoDB } from '../../loaders/MongoDB';
import { ISessionRepository } from '../interfaces/ISessionRepository';

export class MongoSessionRepository implements ISessionRepository {
  constructor(private readonly db: MongoDB) {}

  async create(params: ICreateSessionParams): Promise<ISession> {
    return this.db.create<ISession>(config.mongo.models.Session, {
      teacherId: new Types.ObjectId(params.teacherId),
      startTime: params.startTime,
      endTime: params.endTime,
      status: SessionStatus.AVAILABLE,
      userId: null,
    });
  }

  async findById(sessionId: string): Promise<ISession | null> {
    return this.db.findById<ISession>(config.mongo.models.Session, sessionId);
  }

  async listAvailableByStartRange(start: Date, end: Date): Promise<unknown[]> {
    const pipeline: PipelineStage[] = [
      { $match: { status: SessionStatus.AVAILABLE, startTime: { $gte: start, $lt: end } } },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $sort: { startTime: 1 } },
      {
        $project: {
          _id: 1,
          status: 1,
          startTime: 1,
          endTime: 1,
          teacher: {
            _id: '$teacher._id',
            fullName: '$teacher.fullName',
            specialization: '$teacher.specialization',
            experience: '$teacher.experience',
          },
        },
      },
    ];

    return this.db.aggregate(config.mongo.models.Session, pipeline);
  }

  async bookIfAvailable(sessionId: string, userId: string): Promise<ISession | null> {
    return this.db.findOneAndUpdate<ISession>(
      config.mongo.models.Session,
      { _id: sessionId, status: SessionStatus.AVAILABLE },
      { $set: { status: SessionStatus.BOOKED, userId } }
    );
  }

  async completeIfBooked(sessionId: string, completedAt: Date): Promise<ISession | null> {
    return this.db.findOneAndUpdate<ISession>(
      config.mongo.models.Session,
      { _id: sessionId, status: SessionStatus.BOOKED },
      { $set: { status: SessionStatus.COMPLETED, completedAt } }
    );
  }
}
