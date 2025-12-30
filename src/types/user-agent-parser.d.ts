/**
 * Type declarations for user-agent-parser module
 */
declare module 'user-agent-parser' {
  export interface ParsedUserAgent {
    browser: {
      name: string;
      version: string;
    };
    os: {
      name: string;
      version: string;
    };
    device: {
      type: string;
      brand: string;
      model: string;
    };
  }

  export function parse(userAgent: string): ParsedUserAgent;
  export default parse;
}
