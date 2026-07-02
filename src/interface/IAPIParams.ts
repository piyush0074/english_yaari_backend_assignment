/**
 * Typed shapes for validated request payloads passed from controllers into
 * services. Controllers parse req.body/params/query into these.
 */

export interface ICreateUserParams {
  fullName: string;
  email: string;
  phone: string;
}

export interface ICreateTeacherParams {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
}

export interface ICreateSessionParams {
  teacherId: string;
  startTime: Date;
  endTime: Date;
}

export interface IBookSessionParams {
  sessionId: string;
  userId: string;
}
