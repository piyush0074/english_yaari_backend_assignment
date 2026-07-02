import { Schema, model, Document } from 'mongoose';
import config from '../config';

export interface ITeacher extends Document {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    fullName: { type: String, required: [true, 'fullName is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'specialization is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'experience is required'],
      min: [0, 'experience cannot be negative'],
    },
  },
  { timestamps: true }
);

export const TeacherModel = () => model<ITeacher>(config.mongo.models.Teacher, teacherSchema);
