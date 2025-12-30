/**
 * Time unit configuration
 */
interface TimeUnit {
  name: string;
  ms: number;
}

/**
 * Duration information
 */
interface Duration {
  value: number;
  unit: string;
  unitName: string;
  milliseconds: number;
}

/**
 * Formatted expiry information
 */
interface FormattedExpiry {
  iso: string;
  local: string;
  relative: string;
}

/**
 * Expiry calculation result
 */
interface ExpiryResult {
  expiryDate: Date;
  startDate: Date;
  duration: Duration;
  formatted: FormattedExpiry;
}

/**
 * JWT Expiry Helper
 * Utilities for calculating and managing JWT token expiration dates
 */
class JWTExpiryHelper {
  private static TIME_UNITS: Record<string, TimeUnit> = {
    s: { name: 'secondes', ms: 1000 },
    m: { name: 'minutes', ms: 1000 * 60 },
    h: { name: 'heures', ms: 1000 * 60 * 60 },
    d: { name: 'jours', ms: 1000 * 60 * 60 * 24 },
    w: { name: 'semaines', ms: 1000 * 60 * 60 * 24 * 7 },
    y: { name: 'années', ms: 1000 * 60 * 60 * 24 * 365 },
  };

  /**
   * Converts a JWT period string to an expiration date
   * @param period - Period in JWT format (e.g., '7d', '24h', '30m')
   * @param startDate - Start date (default: now)
   * @returns Object containing expiration information
   * @throws Error if period format is invalid
   */
  static calculateExpiry(period: string, startDate: Date = new Date()): ExpiryResult {
    if (typeof period !== 'string' || !period) {
      throw new Error('La période doit être une chaîne de caractères non vide');
    }

    const match = period.match(/^(\d+)([smhdwy])$/);
    if (!match) {
      throw new Error('Invalid period format. Valid example: 7d, 24h, 30m');
    }

    const [, value, unit] = match;
    const amount = parseInt(value, 10);

    if (!this.TIME_UNITS[unit]) {
      throw new Error(`Invalid time unit: ${unit}`);
    }

    const milliseconds = amount * this.TIME_UNITS[unit].ms;
    const expiryDate = new Date(startDate.getTime() + milliseconds);

    return {
      expiryDate,
      startDate,
      duration: {
        value: amount,
        unit: unit,
        unitName: this.TIME_UNITS[unit].name,
        milliseconds,
      },
      formatted: {
        iso: expiryDate.toISOString(),
        local: expiryDate.toLocaleString(),
        relative: this.getRelativeTime(milliseconds),
      },
    };
  }

  /**
   * Convert duration in milliseconds to relative text
   * @param ms - Duration in milliseconds
   * @returns Descriptive text of the duration
   */
  static getRelativeTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} seconde(s)`;
  }

  /**
   * Checks if an expiration date is still valid
   * @param expiryDate - Expiration date to check
   * @returns true if the date has not expired
   */
  static isValid(expiryDate: Date): boolean {
    return expiryDate > new Date();
  }

  /**
   * Get remaining time until expiration
   * @param expiryDate - Expiration date
   * @returns Remaining time in milliseconds (negative if expired)
   */
  static getRemainingTime(expiryDate: Date): number {
    return expiryDate.getTime() - Date.now();
  }

  /**
   * Check if expiration is within a certain threshold
   * @param expiryDate - Expiration date
   * @param thresholdMs - Threshold in milliseconds
   * @returns true if expiration is within threshold
   */
  static isExpiringSoon(expiryDate: Date, thresholdMs: number): boolean {
    const remaining = this.getRemainingTime(expiryDate);
    return remaining > 0 && remaining <= thresholdMs;
  }
}

export default JWTExpiryHelper;
