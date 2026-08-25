import type { BillingCycle } from '../subscriptions.ts';

export type GmailHeader = { name?: string; value?: string };

export type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; attachmentId?: string; size?: number };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id?: string;
  threadId?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
};

export type BillingCandidate = {
  messageId: string;
  threadId: string | null;
  name: string;
  merchant: string;
  priceMinor: number;
  currency: 'JPY';
  billingCycle: BillingCycle;
  chargedOn: string;
  confidence: number;
};
