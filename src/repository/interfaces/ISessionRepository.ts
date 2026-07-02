import { ISession } from '../../Model/Session';
import { ICreateSessionParams } from '../../interface/IAPIParams';

export interface ISessionRepository {
  create(params: ICreateSessionParams): Promise<ISession>;
  findById(sessionId: string): Promise<ISession | null>;
  listAvailableByStartRange(start: Date, end: Date): Promise<unknown[]>;
  bookIfAvailable(sessionId: string, userId: string): Promise<ISession | null>;
  completeIfBooked(sessionId: string, completedAt: Date): Promise<ISession | null>;
}
