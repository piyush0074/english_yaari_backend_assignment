export interface ITeacherRepository {
  existsById(teacherId: string): Promise<boolean>;
}
