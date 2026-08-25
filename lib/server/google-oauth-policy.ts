export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export function hasOnlyGmailReadonlyScope(value: string | undefined): boolean {
  const scopes = new Set((value ?? '').split(/\s+/u).filter(Boolean));
  return scopes.size === 1 && scopes.has(GMAIL_READONLY_SCOPE);
}
