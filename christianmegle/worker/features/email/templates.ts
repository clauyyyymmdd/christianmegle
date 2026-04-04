import type { EmailPayload, EmailTemplate } from './types';

export function renderTemplate(template: EmailTemplate): EmailPayload {
  switch (template.type) {
    case 'priest-application':
      return {
        to: '', // filled by caller from env
        subject: `Priest Application: ${template.displayName}`,
        body: [
          `New priest application received.`,
          ``,
          `Name: ${template.displayName}`,
          `Quiz Score: ${template.quizScore}/${template.quizTotal}`,
          `Passed: ${template.passed ? 'Yes' : 'No'}`,
          ...(template.heavenResponse
            ? [``, `"Will you go to heaven? Why?"`, template.heavenResponse]
            : []),
        ].join('\n'),
      };

    case 'bug-report':
      return {
        to: '',
        subject: `Bug Report: ${template.description.slice(0, 60)}`,
        body: [
          `Bug report submitted.`,
          ``,
          `Description: ${template.description}`,
          `Time: ${template.timestamp}`,
          ...(template.url ? [`URL: ${template.url}`] : []),
          ...(template.userAgent ? [`User Agent: ${template.userAgent}`] : []),
        ].join('\n'),
      };
  }
}
