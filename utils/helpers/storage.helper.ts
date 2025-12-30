import fs from 'fs';

/**
 * Singleton class for file system operations
 */
class StorageHelper {
  private static instance: StorageHelper;

  private constructor() {
    if (StorageHelper.instance) {
      return StorageHelper.instance;
    }
    StorageHelper.instance = this;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StorageHelper {
    if (!StorageHelper.instance) {
      StorageHelper.instance = new StorageHelper();
    }
    return StorageHelper.instance;
  }

  /**
   * Check if file or directory exists
   */
  checkIfFileOrDirectoryExists(path: string): boolean {
    return fs.existsSync(path);
  }

  /**
   * Read directory contents
   */
  readFolder(folder: string): string[] {
    return fs.readdirSync(folder);
  }

  /**
   * Read file contents
   */
  async getFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string | Buffer> {
    return encoding ? fs.readFileSync(path, encoding) : fs.readFileSync(path);
  }

  /**
   * Create file with data
   */
  async createFile(path: string, fileName: string, data: string | Buffer): Promise<void> {
    if (!this.checkIfFileOrDirectoryExists(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    return fs.writeFileSync(`${path}/${fileName}`, data, 'utf8');
  }

  /**
   * Delete file
   */
  deleteFile(path: string): void {
    return fs.unlinkSync(path);
  }
}

export default StorageHelper.getInstance();
