/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
  cid?: string;
}

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Email template data
 */
export interface EmailTemplateData {
  [key: string]: any;
}

/**
 * Email queue job data
 */
export interface EmailJobData {
  to: string | string[];
  subject: string;
  template?: string;
  data?: EmailTemplateData;
  options?: Partial<EmailOptions>;
}

/**
 * Batch email data
 */
export interface BatchEmailData {
  recipients: string[];
  subject: string;
  template?: string;
  data?: EmailTemplateData;
}

/**
 * Mail service interface
 */
export interface IMailService {
  sendMail(options: EmailOptions): Promise<boolean>;
  sendWithTemplate(to: string | string[], subject: string, template: string, data: EmailTemplateData): Promise<boolean>;
  sendBatch(emails: BatchEmailData): Promise<boolean>;
  addToQueue(jobData: EmailJobData): Promise<boolean>;
}
