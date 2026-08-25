import assert from 'node:assert/strict';
import test from 'node:test';
import { GMAIL_READONLY_SCOPE, hasOnlyGmailReadonlyScope } from '../lib/server/google-oauth-policy.ts';

test('Gmail OAuthは読み取り専用scopeだけを許可する', () => {
  assert.equal(hasOnlyGmailReadonlyScope(GMAIL_READONLY_SCOPE), true);
  assert.equal(hasOnlyGmailReadonlyScope(undefined), false);
  assert.equal(hasOnlyGmailReadonlyScope('https://mail.google.com/'), false);
  assert.equal(hasOnlyGmailReadonlyScope(`${GMAIL_READONLY_SCOPE} openid`), false);
  assert.equal(hasOnlyGmailReadonlyScope('https://www.googleapis.com/auth/gmail.modify'), false);
});
