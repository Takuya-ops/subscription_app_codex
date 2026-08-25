import assert from 'node:assert/strict';
import test from 'node:test';
import { constantTimeEqual, decryptSecret, encryptSecret, isValidEncryptionKey, sha256Base64Url } from '../lib/server/secret-crypto.ts';

const key = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1)).toString('base64');

test('AES-GCMは用途を分離して秘密値を復号できる', async () => {
  const first = await encryptSecret('refresh-token', key, 'looply:test:refresh');
  const second = await encryptSecret('refresh-token', key, 'looply:test:refresh');
  assert.notEqual(first, second);
  assert.equal(await decryptSecret(first, key, 'looply:test:refresh'), 'refresh-token');
  await assert.rejects(() => decryptSecret(first, key, 'looply:test:access'));
});

test('AES-GCMは改ざん・不正鍵・不正形式を拒否する', async () => {
  const encrypted = await encryptSecret('secret', key, 'looply:test');
  const parts = encrypted.split('.');
  parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
  const tampered = parts.join('.');
  await assert.rejects(() => decryptSecret(tampered, key, 'looply:test'));
  assert.equal(isValidEncryptionKey(key), true);
  assert.equal(isValidEncryptionKey('short'), false);
  await assert.rejects(() => encryptSecret('secret', 'short', 'looply:test'));
});

test('PKCE SHA-256はRFC 7636の既知ベクトルと一致する', async () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(await sha256Base64Url(verifier), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  assert.equal(constantTimeEqual('same', 'same'), true);
  assert.equal(constantTimeEqual('same', 'different'), false);
});
