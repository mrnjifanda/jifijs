import { HelperOptions } from 'handlebars';

/**
 * Handlebars custom helpers
 */

// ========================================
// COMPARISON HELPERS
// ========================================

export const eq = (a: any, b: any): boolean => a === b;
export const ne = (a: any, b: any): boolean => a !== b;
export const gt = (a: any, b: any): boolean => a > b;
export const gte = (a: any, b: any): boolean => a >= b;
export const lt = (a: any, b: any): boolean => a < b;
export const lte = (a: any, b: any): boolean => a <= b;

// ========================================
// LOGIC HELPERS
// ========================================

export function and(...args: any[]): boolean {
  return Array.prototype.slice.call(args, 0, -1).every(Boolean);
}

export function or(...args: any[]): boolean {
  return Array.prototype.slice.call(args, 0, -1).some(Boolean);
}

export const not = (value: any): boolean => !value;

// ========================================
// STRING HELPERS
// ========================================

export function concat(...args: any[]): string {
  const values = Array.prototype.slice.call(args, 0, -1);
  return values.join('');
}

export const uppercase = (str: any): string => (str ? str.toString().toUpperCase() : '');
export const lowercase = (str: any): string => (str ? str.toString().toLowerCase() : '');

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function replace(str: string, find: string, replaceWith: string): string {
  if (!str) return '';
  return str.replace(new RegExp(find, 'g'), replaceWith);
}

// ========================================
// NUMBER HELPERS
// ========================================

export const add = (a: number, b: number): number => Number(a) + Number(b);
export const subtract = (a: number, b: number): number => Number(a) - Number(b);
export const multiply = (a: number, b: number): number => Number(a) * Number(b);
export const divide = (a: number, b: number): number => Number(a) / Number(b);
export const mod = (a: number, b: number): number => Number(a) % Number(b);

export function formatNumber(number: number, decimals: number = 2): string {
  if (!number) return '0';
  return Number(number).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ========================================
// ARRAY HELPERS
// ========================================

export function length(array: any[]): number {
  if (!array) return 0;
  return Array.isArray(array) ? array.length : 0;
}

export function first(array: any[]): any {
  if (!array || !Array.isArray(array) || array.length === 0) return null;
  return array[0];
}

export function last(array: any[]): any {
  if (!array || !Array.isArray(array) || array.length === 0) return null;
  return array[array.length - 1];
}

export function join(array: any[], separator: string): string {
  if (!array || !Array.isArray(array)) return '';
  return array.join(separator || ', ');
}

export function includes(array: any[], value: any): boolean {
  if (!array || !Array.isArray(array)) return false;
  return array.includes(value);
}

// ========================================
// DATE HELPERS
// ========================================

export function formatDate(date: Date | string, format: string = 'DD/MM/YYYY'): string {
  if (!date) return '';

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function timeAgo(date: Date | string): string {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

// ========================================
// OBJECT HELPERS
// ========================================

export const get = (obj: any, key: string): any => (obj ? obj[key] : null);
export const hasKey = (obj: any, key: string): boolean =>
  obj ? Object.prototype.hasOwnProperty.call(obj, key) : false;
export const keys = (obj: any): string[] => (obj ? Object.keys(obj) : []);
export const values = (obj: any): any[] => (obj ? Object.values(obj) : []);

// ========================================
// UTILITY HELPERS
// ========================================

export const defaultValue = (value: any, defaultVal: any): any =>
  value != null ? value : defaultVal;
export const json = (obj: any): string => JSON.stringify(obj);
export const jsonPretty = (obj: any): string => JSON.stringify(obj, null, 2);
export const ternary = (condition: any, yes: any, no: any): any => (condition ? yes : no);

export function switchHelper(this: any, value: any, options: HelperOptions): string {
  this.switch_value = value;
  this.switch_break = false;
  return options.fn(this);
}

export function caseHelper(this: any, value: any, options: HelperOptions): string {
  if (value === this.switch_value && !this.switch_break) {
    this.switch_break = true;
    return options.fn(this);
  }
  return '';
}

// ========================================
// LOOP HELPERS
// ========================================

export function times(n: number, block: HelperOptions): string {
  let result = '';
  for (let i = 0; i < n; i++) {
    result += block.fn({ index: i, number: i + 1 });
  }
  return result;
}

export function range(start: number, end: number, block: HelperOptions): string {
  let result = '';
  for (let i = start; i < end; i++) {
    result += block.fn({ value: i });
  }
  return result;
}

export function eachWithIndex(array: any[], options: HelperOptions): string {
  if (!array || !Array.isArray(array)) return '';

  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += options.fn(array[i], {
      data: {
        index: i,
        first: i === 0,
        last: i === array.length - 1,
      },
    });
  }
  return result;
}

// ========================================
// EMAIL SPECIFIC HELPERS
// ========================================

export function roleIcon(role: string): string {
  const icons: Record<string, string> = {
    TEACHER: '👨‍🏫',
    ADMIN: '👑',
    USER: '👤',
    STUDENT: '📚',
  };
  return icons[role] || '👤';
}

export function roleName(role: string): string {
  const names: Record<string, string> = {
    TEACHER: 'Teacher',
    ADMIN: 'Administrator',
    USER: 'Student',
    STUDENT: 'Student',
  };
  return names[role] || 'User';
}

export function statusBadge(status: string): string {
  const badges: Record<string, string> = {
    ACTIVE: '✅ Active',
    INACTIVE: '⏸️ Inactive',
    PENDING: '⏳ Pending',
    ARCHIVED: '📦 Archived',
    DELETED: '🗑️ Deleted',
  };
  return badges[status] || status;
}

// ========================================
// HTML HELPERS
// ========================================

export function escapeHtml(text: string): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (s) => map[s]);
}

export function nl2br(text: string): string {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function countWithSuffix(count: number, word: string): string {
  const plural = count === 1 ? word : word + 's';
  return `${count} ${plural}`;
}

// Default export
export default {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  concat,
  uppercase,
  lowercase,
  capitalize,
  truncate,
  replace,
  add,
  subtract,
  multiply,
  divide,
  mod,
  formatNumber,
  length,
  first,
  last,
  join,
  includes,
  formatDate,
  timeAgo,
  currentYear,
  get,
  hasKey,
  keys,
  values,
  default: defaultValue,
  json,
  jsonPretty,
  ternary,
  switch: switchHelper,
  case: caseHelper,
  times,
  range,
  eachWithIndex,
  roleIcon,
  roleName,
  statusBadge,
  escapeHtml,
  nl2br,
  pluralize,
  countWithSuffix,
};
