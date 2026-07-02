export interface IUserRepository {
  existsById(userId: string): Promise<boolean>;
}
