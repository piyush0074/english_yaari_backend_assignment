import { Schema, model, Document, Types } from 'mongoose';
import config from '../config';

export enum SessionStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
}

export interface ISession extends Document {
  teacherId: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: config.mongo.models.Teacher,
      required: [true, 'teacherId is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: config.mongo.models.User,
      default: null,
      index: true,
    },
    startTime: { type: Date, required: [true, 'startTime is required'] },
    endTime: { type: Date, required: [true, 'endTime is required'] },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.AVAILABLE,
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const SessionModel = () => model<ISession>(config.mongo.models.Session, sessionSchema);
