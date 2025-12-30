import dotenv from 'dotenv';
import { IConfig, MailSettings, RedisConfig, AppInfo, AdminUserConfig } from '../src/types';

dotenv.config();

/**
 * Singleton configuration class
 * Manages all application configuration from environment variables
 */
class Config implements IConfig {
  private static instance: Config;
  public env: NodeJS.ProcessEnv;

  private constructor(env: NodeJS.ProcessEnv) {
    if (Config.instance) {
      return Config.instance;
    }

    this.env = env;
    Config.instance = this;
  }

  /**
   * Get singleton instance of Config
   * @param env - Process environment variables
   * @returns Config instance
   */
  static getInstance(env: NodeJS.ProcessEnv = process.env): Config {
    if (!Config.instance) {
      Config.instance = new Config(env);
    }
    return Config.instance;
  }

  /**
   * Get a single environment variable value
   * @param key - Environment variable key
   * @param throwOnMissing - Whether to throw if key is missing
   * @returns Value or undefined
   */
  getValue(key: string, throwOnMissing: boolean = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }
    return value || '';
  }

  /**
   * Ensure all required values exist
   * @param keys - Array of required environment variable keys
   * @returns Config instance for chaining
   */
  ensureValues(keys: string[]): Config {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  /**
   * Get comma-separated list from environment variable
   * @param keys - Environment variable key
   * @param separator - Separator character (default: ',')
   * @returns Array of trimmed values
   */
  getLists(keys: string, separator: string = ','): string[] {
    const key = this.getValue(keys, false);
    if (key) {
      return String(key)
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  /**
   * Get application name
   */
  getName(): string {
    return this.getValue('APP_NAME');
  }

  /**
   * Get application mode
   */
  getMode(): string {
    return this.getValue('APP_MODE');
  }

  /**
   * Get application port
   */
  getPort(): string {
    return this.getValue('APP_PORT');
  }

  /**
   * Get application URL
   */
  getUrl(): string {
    return this.getValue('APP_URL');
  }

  /**
   * Get mail configuration settings
   * Returns different configs for production vs development
   */
  getMailSettings(): MailSettings {
    if (this.use('mail')) {
      const isProd = this.isProduction() ? '' : '_DEV';
      const data: MailSettings = {
        host: this.getValue('MAIL_HOST' + isProd, false),
        port: this.getValue('MAIL_PORT' + isProd, false),
        user: this.getValue('MAIL_USER' + isProd, false),
        senderName: this.getValue('MAIL_SENDER_NAME' + isProd, false),
        senderEmail: this.getValue('MAIL_SENDER_EMAIL' + isProd, false),
        secure: this.getValue('MAIL_SECURE' + isProd, false) === 'true',
      };

      if (data.secure) {
        data.service = this.getValue('MAIL_SERVICE' + isProd);
        data.auth = {
          user: this.getValue('MAIL_USER' + isProd),
          pass: this.getValue('MAIL_PASSWORD' + isProd),
        };
      }

      return data;
    }

    return {};
  }

  /**
   * Get application information object
   */
  getAppInfo(): AppInfo {
    return {
      is_production: this.isProduction(),
      port: this.getPort(),
      name: this.getName(),
      url_frontend: this.getValue('APP_URL_FRONTEND', false),
      url_prefix: this.getPrefixRoutes(),
      url: `${this.getUrl() + this.getPrefixRoutes()}`,
      version: this.getValue('APP_VERSION', false),
    };
  }

  /**
   * Get route prefix
   * Removes trailing slash if present
   */
  getPrefixRoutes(): string {
    let prefix = this.getValue('APP_PREFIX_ROUTES', false) ?? '';
    if (prefix && prefix.slice(-1) === '/') {
      prefix = prefix.slice(0, -1);
    }
    return prefix;
  }

  /**
   * Get database connection URL
   */
  getDatabase(): string {
    return this.getValue('DATABASE_URL');
  }

  /**
   * Get Redis configuration
   */
  getRedis(): RedisConfig {
    return {
      host: this.getValue('REDIS_HOST'),
      port: this.getValue('REDIS_PORT'),
      password: this.getValue('REDIS_PASSWORD', false),
      connectTimeout: 10000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      family: 4,
      base_name: this.getValue('REDIS_QUEUE'),
    };
  }

  /**
   * Get JWT secret token
   */
  getSecret(): string {
    return this.getValue('SECRET_TOKEN');
  }

  /**
   * Check if a feature is enabled
   * @param key - Feature name (will be prefixed with USE_)
   * @returns true if enabled
   */
  use(key: string): boolean {
    const value = this.getValue(`USE_${key.toUpperCase()}`, false);
    return value === 'yes';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    const mode = this.getValue('APP_MODE', false);
    return mode.toUpperCase() === 'PRODUCTION';
  }

  /**
   * Get X-API-Key for authentication
   */
  getXApiKey(): string {
    return this.getValue('X_API_KEY');
  }

  /**
   * Get admin user configuration for seeding
   * @param role - User role (default: 'ADMIN')
   */
  getAdminUser(role: string = 'ADMIN'): AdminUserConfig {
    return {
      last_name: this.getValue('USER_LASTNAME'),
      first_name: this.getValue('USER_FIRSTNAME'),
      username: this.getValue('USER_USERNAME'),
      email: this.getValue('USER_EMAIL'),
      password: this.getValue('USER_PASSWORD'),
      password_confirm: this.getValue('USER_PASSWORD'),
      role,
    };
  }
}

// Export singleton instance
export default Config.getInstance(process.env).ensureValues(['APP_MODE']);
