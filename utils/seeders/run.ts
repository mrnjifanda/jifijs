import { configs } from '../../configs/app.config';
import db from '../../configs/database.config';
import ManagerSeeder, { SeederResults } from './manager/manager.seeder';
import UserSeeder from './seeds/user.seeder';
import Seeder from './manager/seeder';

/**
 * Seeder configuration
 */
interface SeederConfig {
  name: string;
  data: Seeder<any>;
}

/**
 * Run seeders
 * @param seeders - Array of seeder configurations
 * @param seederName - Optional specific seeder name to run
 */
async function run(seeders: SeederConfig[], seederName: string | null = null): Promise<void> {
  await db.connect(configs.getDatabase());
  console.log('📦 MongoDB connection successful');

  const manager = new ManagerSeeder();
  seeders.forEach((seeder) => {
    manager.register(seeder.name, seeder.data);
  });

  let results: boolean | SeederResults;
  if (seederName) {
    results = await manager.runOne(seederName);
  } else {
    results = await manager.run();
  }

  console.log('✅ Résultats des seeders:', results);
  await db.disconnect();
}

const data: SeederConfig[] = [
  { name: 'users', data: new UserSeeder({ count: 10 }) },
];

run(data).catch((err) => {
  console.error("Erreur lors de l'exécution des seeders:", err);
  process.exit(1);
});
