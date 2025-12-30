/**
 * Token blacklist service
 * Manages revoked JWT tokens with automatic cleanup of expired tokens
 */
class TokenBlacklist {
  private blacklist: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanup();
  }

  /**
   * Add token to blacklist
   * @param token - JWT token to blacklist
   */
  add(token: string): void {
    if (token) {
      this.blacklist.add(token);
    }
  }

  /**
   * Check if token is blacklisted
   * @param token - JWT token to check
   * @returns true if token is blacklisted
   */
  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  /**
   * Remove token from blacklist
   * @param token - JWT token to remove
   */
  remove(token: string): void {
    this.blacklist.delete(token);
  }

  /**
   * Get blacklist size
   * @returns Number of blacklisted tokens
   */
  size(): number {
    return this.blacklist.size;
  }

  /**
   * Clear all tokens from blacklist
   */
  clear(): void {
    this.blacklist.clear();
  }

  /**
   * Setup automatic cleanup of expired tokens every hour
   * @private
   */
  private cleanup(): void {
    // Clean expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const token of this.blacklist) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          if (payload.exp && payload.exp * 1000 < now) {
            this.blacklist.delete(token);
          }
        } catch (error) {
          // Invalid token format - remove it
          this.blacklist.delete(token);
        }
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const tokenBlacklist = new TokenBlacklist();
export default tokenBlacklist;
