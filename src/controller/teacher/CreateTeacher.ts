import { Request, Response } from 'express';
import { CreatedResponse } from '../../core/APIresponse';
import { TeacherService } from '../service/TeacherService';

/**
 * Helper — Create Teacher (POST /teachers).
 * Not part of the mandatory API list, but required to seed teachers so sessions
 * (API 2) can be created and validated against a real teacher.
 */
export class CreateTeacher {
  private readonly teacherService = new TeacherService();

  public async execute(req: Request, res: Response): Promise<Response> {
    const teacher = await this.teacherService.createTeacher({
      fullName: req.body.fullName,
      email: req.body.email,
      specialization: req.body.specialization,
      experience: Number(req.body.experience),
    });

    return new CreatedResponse('Teacher created successfully', teacher).send(res);
  }
}
