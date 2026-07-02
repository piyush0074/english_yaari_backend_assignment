import { Request, Response } from 'express';
import { SuccessResponse } from '../../core/APIresponse';
import { SessionService } from '../service/SessionService';

/**
 * API 4 — Book Session (POST /sessions/:id/book).
 * User & session must exist; only AVAILABLE sessions can be booked; a booked
 * session cannot be booked again.
 */
export class BookSession {
  constructor(private readonly sessionService: SessionService) {}

  public async execute(req: Request, res: Response): Promise<Response> {
    const session = await this.sessionService.bookSession({
      sessionId: req.params.id,
      userId: req.body.userId,
    });

    return new SuccessResponse('Session booked successfully', session).send(res);
  }
}
