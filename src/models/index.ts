import { AppDataSource } from '@/models/data-source';
import { User } from '@/models/entity/User';

AppDataSource.initialize()
  .then(async () => {
    console.log('Loading users from the database...');
    const users = await AppDataSource.manager.find(User);
    console.log('Loaded users: ', users);

    console.log(
      'Here you can setup and run express / fastify / any other framework.',
    );
  })
  .catch((error) => console.log(error));
