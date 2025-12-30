import BaseService from '../../../utils/bases/base.service';
import User from '../../models/auth/user.model';
import { IUser } from '../../types';

/**
 * User Service
 * Manages user data operations
 * Extends BaseService with IUser document type
 */
class UserService extends BaseService<IUser> {
  private static instance: UserService;

  private constructor() {
    if (UserService.instance) {
      return UserService.instance;
    }
    super(User);
    UserService.instance = this;
  }

  /**
   * Get singleton instance
   * @returns UserService instance
   */
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
}

export default UserService.getInstance();
