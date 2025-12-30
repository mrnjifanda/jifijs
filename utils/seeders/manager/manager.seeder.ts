import Seeder from './seeder';

/**
 * Results of running seeders
 */
export interface SeederResults {
  [name: string]: boolean;
}

/**
 * Manager for database seeders
 */
class ManagerSeeder {
  private seeders: Map<string, Seeder<any>>;

  constructor() {
    this.seeders = new Map();
  }

  /**
   * Register a seeder with a name
   * @param name - Name of the seeder
   * @param seeder - Seeder instance
   * @returns this - For method chaining
   */
  register(name: string, seeder: Seeder<any>): this {
    this.seeders.set(name, seeder);
    return this;
  }

  /**
   * Get a registered seeder by name
   * @param name - Name of the seeder
   * @returns Seeder instance
   * @throws Error if seeder is not registered
   */
  get(name: string): Seeder<any> {
    if (!this.seeders.has(name)) {
      throw new Error(`Seeder "${name}" is not registered`);
    }

    return this.seeders.get(name)!;
  }

  /**
   * List all registered seeder names
   * @returns Array of seeder names
   */
  list(): string[] {
    return Array.from(this.seeders.keys());
  }

  /**
   * Run a single seeder by name
   * @param name - Name of the seeder to run
   * @returns true if successful, false otherwise
   */
  async runOne(name: string): Promise<boolean> {
    const seeder = this.get(name);
    console.log(`Running seeder: ${name}`);
    return await seeder.run();
  }

  /**
   * Run all registered seeders
   * @returns Object with seeder names as keys and success status as values
   */
  async run(): Promise<SeederResults> {
    const results: SeederResults = {};

    for (const [name, seeder] of this.seeders) {
      console.log(`Running seeder: ${name}`);
      results[name] = await seeder.run();
    }

    return results;
  }
}

export default ManagerSeeder;
