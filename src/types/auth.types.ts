import { Types } from 'mongoose';
import { BaseDocument } from './service.types';

/**
 * User roles enum
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * User document interface
 */
export interface IUser extends BaseDocument {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

/**
 * Browser information
 */
export interface BrowserInfo {
  name?: string;
  version?: string;
  major?: string;
}

/**
 * OS information
 */
export interface OSInfo {
  name?: string;
  version?: string;
}

/**
 * Device information
 */
export interface DeviceInfo {
  browser?: BrowserInfo;
  os?: OSInfo;
  platform?: string;
  source?: string;
}

/**
 * Location information
 */
export interface LocationInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  ll?: number[];
}

/**
 * Login history entry (for embedded arrays)
 */
export interface LoginHistory {
  ip: string;
  token: string;
  refresh_token: string;
  login_at: Date;
  devices?: DeviceInfo;
  locations?: LocationInfo;
}

/**
 * Login history document interface (for collection)
 */
export interface ILoginHistory extends BaseDocument {
  auth: Types.ObjectId | IAuth;
  user: Types.ObjectId | IUser;
  ip: string;
  token: string;
  refresh_token: string;
  login_at: Date;
  devices?: DeviceInfo;
  locations?: LocationInfo;
  user_agent?: string;
  expires_at?: Date;
}

/**
 * Password history entry
 */
export interface PasswordHistory {
  password: string;
  changed_at: Date;
}

/**
 * Auth document interface
 */
export interface IAuth extends BaseDocument {
  user: Types.ObjectId | IUser;
  role: UserRole;
  password_history: PasswordHistory[];
  passwords: PasswordHistory[];
  otp?: string;
  otp_expired_at?: Date;
  confirmation_token?: string;
  confirmation_token_expired_at?: Date;
  confirmed_at?: Date;
  reset_password_token?: string;
  reset_password_token_expired_at?: Date;
  is_active: boolean;
  last_login?: Date;
}

/**
 * X-API-Key status enum
 */
export enum XApiKeyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * X-API-Key document interface
 */
export interface IXApiKey extends BaseDocument {
  user: string;
  keys: string;
  status: XApiKeyStatus;
  last_used?: Date;
}

/**
 * JWT payload interface
 */
export interface JWTPayload {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Token pair interface
 */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register credentials
 */
export interface RegisterCredentials {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role?: UserRole;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

/**
 * Password reset request data
 */
export interface PasswordResetRequestData {
  email: string;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  token: string;
  password: string;
  password_confirm: string;
}

/**
 * OTP verification data
 */
export interface OTPVerificationData {
  email: string;
  otp: string;
}

/**
 * Auth user data (from token)
 */
export interface AuthUser {
  id: string;
  email?: string;
  role?: UserRole;
}

/**
 * Request details for login tracking
 */
export interface RequestDetails {
  ip: string;
  userAgent: string;
  device?: DeviceInfo;
  location?: LocationInfo;
}
