import { Model, Document } from 'mongoose';

/**
 * Seeder options
 */
export interface SeederOptions {
  truncate?: boolean;
  count?: number;
}

/**
 * Base Seeder class for database seeding
 */
class Seeder<T extends Document = Document> {
  protected model: Model<T>;
  protected options: Required<SeederOptions>;
  protected customData: any[] | null;

  constructor(model: Model<T>, options: SeederOptions = {}) {
    this.model = model;
    this.options = {
      truncate: true,
      count: 10,
      ...options,
    };
    this.customData = null;
  }

  /**
   * Set custom data to seed instead of generating fake data
   * @param data - Custom data array or single object
   * @returns this - For method chaining
   */
  setCustomData(data: any | any[]): this {
    this.customData = Array.isArray(data) ? data : [data];
    return this;
  }

  /**
   * Generate fake data for seeding
   * Must be implemented in child classes
   */
  generateFakeData(): any[] {
    throw new Error('The generateFakeData method must be implemented in child classes');
  }

  /**
   * Truncate the collection if truncate option is enabled
   */
  async truncate(): Promise<void> {
    if (this.options.truncate) {
      console.log(`Cleaning the collection ${this.model.collection.name}...`);
      await this.model.deleteMany({});
    }
  }

  /**
   * Run the seeder
   * @returns true if successful, false otherwise
   */
  async run(): Promise<boolean> {
    try {
      await this.truncate();

      const dataToInsert = this.customData || this.generateFakeData();

      console.log(`Inserting ${dataToInsert.length} documents into ${this.model.collection.name}...`);
      await this.model.insertMany(dataToInsert);

      console.log(`Seed de ${this.model.collection.name} terminé avec succès`);
      return true;
    } catch (error) {
      console.error(`Erreur lors du seed de ${this.model.collection.name}:`, error);
      return false;
    }
  }
}

export default Seeder;
