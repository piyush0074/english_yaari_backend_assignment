import { Request, Response } from 'express';
import { CreatedResponse } from '../../core/APIresponse';
import { UserService } from '../service/UserService';

/**
 * API 1 — Create User (POST /users). Email must be unique.
 * Request body is validated upstream by CreateUserValidation middleware.
 */
export class CreateUser {
  private readonly userService = new UserService();

  public async execute(req: Request, res: Response): Promise<Response> {
    const user = await this.userService.createUser({
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
    });

    return new CreatedResponse('User created successfully', user).send(res);
  }
}
