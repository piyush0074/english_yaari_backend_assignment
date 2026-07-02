import { Request, Response } from 'express';
import { SuccessResponse } from '../../core/APIresponse';
import { UserService } from '../service/UserService';

/**
 * API 6 — User Session List (GET /users/:id/sessions).
 * Returns the user's sessions split into Upcoming and Completed.
 */
export class GetUserSessions {
  private readonly userService = new UserService();

  public async execute(req: Request, res: Response): Promise<Response> {
    const buckets = await this.userService.getUserSessions(req.params.id);
    return new SuccessResponse('User sessions retrieved successfully', buckets).send(res);
  }
}
