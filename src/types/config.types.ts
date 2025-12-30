/**
 * Mail settings configuration
 */
export interface MailSettings {
  host?: string;
  port?: string | number;
  user?: string;
  senderName?: string;
  senderEmail?: string;
  secure?: boolean;
  service?: string;
  auth?: {
    user: string;
    pass: string;
  };
}

/**
 * Redis configuration
 */
export interface RedisConfig {
  host: string;
  port: string | number;
  password?: string;
  connectTimeout: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  family: number;
  base_name: string;
}

/**
 * Application info
 */
export interface AppInfo {
  is_production: boolean;
  port: string | number;
  name: string;
  url_frontend?: string;
  url_prefix: string;
  url: string;
  version?: string;
}

/**
 * Admin user configuration
 */
export interface AdminUserConfig {
  last_name: string;
  first_name: string;
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role: string;
}

/**
 * Config class interface
 */
export interface IConfig {
  getValue(key: string, throwOnMissing?: boolean): string | undefined;
  ensureValues(keys: string[]): IConfig;
  getLists(keys: string, separator?: string): string[];
  getName(): string;
  getMode(): string;
  getPort(): string;
  getUrl(): string;
  getMailSettings(): MailSettings;
  getAppInfo(): AppInfo;
  getPrefixRoutes(): string;
  getDatabase(): string;
  getRedis(): RedisConfig;
  getSecret(): string;
  use(key: string): boolean;
  isProduction(): boolean;
  getXApiKey(): string;
  getAdminUser(role?: string): AdminUserConfig;
}
