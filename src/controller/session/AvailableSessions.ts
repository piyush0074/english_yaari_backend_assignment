import { Request, Response } from 'express';
import { SuccessResponse } from '../../core/APIresponse';
import { BadRequestError } from '../../core/APIerror';
import { SessionService } from '../service/SessionService';

/**
 * API 3 — Available Sessions for Booking
 * GET /sessions/available?dateTimestamp={timestamp}
 * Returns all AVAILABLE sessions for the supplied date (aggregation pipeline).
 */
export class AvailableSessions {
  constructor(private readonly sessionService: SessionService) {}

  public async execute(req: Request, res: Response): Promise<Response> {
    const raw = req.query.dateTimestamp;
    if (raw === undefined) {
      throw new BadRequestError('dateTimestamp query parameter is required');
    }

    const timestampMs = Number(raw);
    if (!Number.isFinite(timestampMs)) {
      throw new BadRequestError('dateTimestamp must be a numeric epoch timestamp (ms)');
    }

    const { from, to, sessions } = await this.sessionService.getAvailableSessions(timestampMs);

    return new SuccessResponse('Available sessions retrieved successfully', {
      count: sessions.length,
      date: { from, to },
      sessions,
    }).send(res);
  }
}
