// import { faker } from '@faker-js/faker'; // Uncommented if you want to generate fake data.

import Seeder, { SeederOptions } from '../manager/seeder';
import User from '../../../src/models/auth/user.model';
import { configs } from '../../../configs/app.config';
import { IUser } from '../../../src/types';

/**
 * User seeder for database seeding
 */
class UserSeeder extends Seeder<IUser> {
  // password = "PassWORD@2025";

  constructor(options: SeederOptions = {}) {
    super(User, options);
    this.setCustomData(configs.getAdminUser());
  }

  // generateFakeData(): any[] {
  //   const users = [];
  //   for (let i = 0; i < this.options.count; i++) {
  //     users.push({
  //       last_name: faker.person.lastName(),
  //       first_name: faker.person.firstName(),
  //       username: faker.internet.username(),
  //       email: faker.internet.email(),
  //       password: this.password,
  //       password_confirm: this.password,
  //       role: ROLES[0],
  //     });
  //   }

  //   return users;
  // }
}

export default UserSeeder;
