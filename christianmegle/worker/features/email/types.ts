export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file contents (no data-URL prefix). */
  content: string;
  contentType: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export interface PriestApplicationEmail {
  type: 'priest-application';
  displayName: string;
  quizScore: number;
  quizTotal: number;
  passed: boolean;
  heavenResponse?: string;
}

export interface BugReportEmail {
  type: 'bug-report';
  description: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
}

export type EmailTemplate = PriestApplicationEmail | BugReportEmail;
