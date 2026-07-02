import { Request, Response } from 'express';
import { CreatedResponse } from '../../core/APIresponse';
import { SessionService } from '../service/SessionService';

/**
 * API 2 — Create Session (POST /sessions).
 * Default status AVAILABLE; validates teacher exists and endTime > startTime.
 */
export class CreateSession {
  constructor(private readonly sessionService: SessionService) {}

  public async execute(req: Request, res: Response): Promise<Response> {
    const session = await this.sessionService.createSession({
      teacherId: req.body.teacherId,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
    });

    return new CreatedResponse('Session created successfully', session).send(res);
  }
}
