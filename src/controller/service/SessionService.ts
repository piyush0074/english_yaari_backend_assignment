import { ISession, SessionStatus } from '../../Model/Session';
import { BadRequestError, ConflictError, NotFoundError } from '../../core/APIerror';
import { ICreateSessionParams, IBookSessionParams } from '../../interface/IAPIParams';
import { ISessionRepository } from '../../repository/interfaces/ISessionRepository';
import { IUserRepository } from '../../repository/interfaces/IUserRepository';
import { ITeacherRepository } from '../../repository/interfaces/ITeacherRepository';

/**
 * Business logic for sessions: creation, availability lookup (aggregation),
 * booking, and completion. State transitions use atomic findOneAndUpdate calls
 * so concurrent requests cannot double-book or double-complete a session.
 */
export class SessionService {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly teacherRepository: ITeacherRepository
  ) {}

  /** API 2 — validates teacher existence and endTime > startTime, defaults AVAILABLE. */
  async createSession(params: ICreateSessionParams): Promise<ISession> {
    if (params.endTime.getTime() <= params.startTime.getTime()) {
      throw new BadRequestError('endTime must be greater than startTime');
    }

    const teacherExists = await this.teacherRepository.existsById(params.teacherId);
    if (!teacherExists) throw new NotFoundError('Teacher not found');

    return this.sessionRepository.create(params);
  }

  /**
   * API 3 — returns all AVAILABLE sessions whose startTime falls on the supplied
   * date, via the MongoDB Aggregation Pipeline. The calendar day is resolved in
   * UTC so results are independent of the server's timezone.
   */
  async getAvailableSessions(timestampMs: number): Promise<{ from: Date; to: Date; sessions: unknown[] }> {
    const { start, end } = SessionService.utcDayRange(timestampMs);
    const sessions = await this.sessionRepository.listAvailableByStartRange(start, end);
    return { from: start, to: end, sessions };
  }

  /** API 4 — books an AVAILABLE session for a user (atomic guard against races). */
  async bookSession(params: IBookSessionParams): Promise<ISession> {
    const userExists = await this.userRepository.existsById(params.userId);
    if (!userExists) throw new NotFoundError('User not found');

    const session = await this.sessionRepository.findById(params.sessionId);
    if (!session) throw new NotFoundError('Session not found');
    if (session.status !== SessionStatus.AVAILABLE) {
      throw new ConflictError(`Session cannot be booked (current status: ${session.status})`);
    }

    const booked = await this.sessionRepository.bookIfAvailable(params.sessionId, params.userId);
    if (!booked) throw new ConflictError('Session was just booked by someone else');

    return booked;
  }

  /** API 5 — marks a BOOKED session COMPLETED and stamps completedAt (atomic). */
  async completeSession(sessionId: string): Promise<ISession> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Session not found');
    if (session.status !== SessionStatus.BOOKED) {
      throw new ConflictError(
        `Only BOOKED sessions can be completed (current status: ${session.status})`
      );
    }

    const completed = await this.sessionRepository.completeIfBooked(sessionId, new Date());
    if (!completed) throw new ConflictError('Session status changed before it could be completed');

    return completed;
  }

  /** [startOfDayUTC, nextDayUTC) for the day containing the given epoch-ms timestamp. */
  private static utcDayRange(timestampMs: number): { start: Date; end: Date } {
    const d = new Date(timestampMs);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
}
