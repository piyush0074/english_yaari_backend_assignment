import { Request, Response } from 'express';
import { SuccessResponse } from '../../core/APIresponse';
import { SessionService } from '../service/SessionService';

/**
 * API 5 — Mark Session Complete (PATCH /sessions/:id/complete).
 * Only BOOKED sessions can be completed; sets status COMPLETED and completedAt.
 */
export class CompleteSession {
  constructor(private readonly sessionService: SessionService) {}

  public async execute(req: Request, res: Response): Promise<Response> {
    const session = await this.sessionService.completeSession(req.params.id);
    return new SuccessResponse('Session marked as completed', session).send(res);
  }
}
