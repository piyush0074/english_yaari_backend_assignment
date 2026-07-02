import { PipelineStage, Types } from 'mongoose';
import { Server } from '../../loaders/Server';
import config from '../../config';
import { IUser } from '../../Model/User';
import { SessionStatus } from '../../Model/Session';
import { NotFoundError } from '../../core/APIerror';
import { ICreateUserParams } from '../../interface/IAPIParams';

interface UserSessionBuckets {
  upcomingSessions: unknown[];
  completedSessions: unknown[];
}

/**
 * Business logic for users. DB access goes through the shared MongoDB loader
 * (Server.instance.mongodb) rather than importing models directly.
 */
export class UserService {
  private get db() {
    return Server.instance.mongodb;
  }

  async createUser(params: ICreateUserParams): Promise<IUser> {
    // Email uniqueness is enforced by the schema's unique index; a duplicate
    // bubbles up as an E11000 error and is mapped to a 409 by the error handler.
    return this.db.create<IUser>(config.mongo.models.User, params);
  }

  async ensureUserExists(userId: string): Promise<void> {
    const exists = await this.db.exists<IUser>(config.mongo.models.User, { _id: userId });
    if (!exists) throw new NotFoundError('User not found');
  }

  /**
   * API 6 — returns the user's sessions split into Upcoming (BOOKED) and
   * Completed (COMPLETED) using the MongoDB Aggregation Pipeline. `$lookup`
   * attaches teacher details and `$facet` produces both buckets in one query.
   */
  async getUserSessions(userId: string): Promise<UserSessionBuckets> {
    await this.ensureUserExists(userId);

    const pipeline: PipelineStage[] = [
      { $match: { userId: new Types.ObjectId(userId) } },
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
          completedAt: 1,
          teacher: {
            _id: '$teacher._id',
            fullName: '$teacher.fullName',
            specialization: '$teacher.specialization',
          },
        },
      },
      {
        $facet: {
          upcoming: [{ $match: { status: SessionStatus.BOOKED } }],
          completed: [{ $match: { status: SessionStatus.COMPLETED } }],
        },
      },
    ];

    const [result] = await this.db.aggregate<{ upcoming: unknown[]; completed: unknown[] }>(
      config.mongo.models.Session,
      pipeline
    );

    return {
      upcomingSessions: result?.upcoming ?? [],
      completedSessions: result?.completed ?? [],
    };
  }
}
