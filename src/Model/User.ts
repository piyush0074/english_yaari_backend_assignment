import { Schema, model, Document } from 'mongoose';
import config from '../config';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: [true, 'fullName is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: [true, 'phone is required'], trim: true },
  },
  { timestamps: true }
);

export const UserModel = () => model<IUser>(config.mongo.models.User, userSchema);
