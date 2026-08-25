const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('Invalid encrypted value');
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function rawEncryptionKey(secret: string): Uint8Array {
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/u.test(secret) || /=./u.test(secret)) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  const normalized = secret.replaceAll('-', '+').replaceAll('_', '/').replace(/=+$/u, '');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  const key = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return key;
}

export function isValidEncryptionKey(secret: string): boolean {
  try {
    rawEncryptionKey(secret);
    return true;
  } catch {
    return false;
  }
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', copiedBuffer(rawEncryptionKey(secret)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function copiedBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function randomBase64Url(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base64Url(bytes);
}

export async function sha256Base64Url(value: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

export async function encryptSecret(value: string, secret: string, purpose: string): Promise<string> {
  if (!purpose || purpose.length > 100) throw new Error('Invalid encryption purpose');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: copiedBuffer(iv), additionalData: encoder.encode(purpose), tagLength: 128 },
    await encryptionKey(secret),
    encoder.encode(value),
  );
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value: string, secret: string, purpose: string): Promise<string> {
  if (!purpose || purpose.length > 100 || value.length > 20_000) throw new Error('Invalid encrypted value');
  const [version, encodedIv, encodedCiphertext, extra] = value.split('.');
  if (version !== 'v1' || !encodedIv || !encodedCiphertext || extra) throw new Error('Invalid encrypted value');
  const iv = fromBase64Url(encodedIv);
  if (iv.length !== 12) throw new Error('Invalid encrypted value');
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: copiedBuffer(iv), additionalData: encoder.encode(purpose), tagLength: 128 },
    await encryptionKey(secret),
    copiedBuffer(fromBase64Url(encodedCiphertext)),
  );
  return decoder.decode(decrypted);
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const size = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < size; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}
