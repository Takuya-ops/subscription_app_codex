import type { GmailMessage, GmailMessagePart } from './types.ts';

const MAX_PARTS = 100;
const MAX_DEPTH = 20;
const MAX_DECODED_BYTES = 256 * 1024;

function normalizedBase64(value: string): string {
  if (!/^[A-Za-z0-9_-]*={0,2}$/u.test(value) || /=./u.test(value)) throw new Error('Invalid base64url data');
  const unpadded = value.replace(/=+$/u, '');
  if (unpadded.length % 4 === 1) throw new Error('Invalid base64url data');
  return unpadded.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(unpadded.length / 4) * 4, '=');
}

export function decodeBase64Url(value: string, maxBytes = MAX_DECODED_BYTES): Uint8Array {
  const normalized = normalizedBase64(value);
  if (normalized.length > Math.ceil(maxBytes / 3) * 4 + 4) throw new Error('Decoded Gmail body is too large');
  const binary = atob(normalized);
  if (binary.length > maxBytes) throw new Error('Decoded Gmail body is too large');
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function decodeBase64UrlText(value: string, maxBytes = MAX_DECODED_BYTES): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(decodeBase64Url(value, maxBytes));
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', yen: '¥',
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, key: string) => {
    const lower = key.toLowerCase();
    if (lower.startsWith('#x')) {
      const point = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(point) && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    if (lower.startsWith('#')) {
      const point = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(point) && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    return named[lower] ?? entity;
  });
}

export function htmlToSafeText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|head|noscript|svg|template|iframe|object)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/giu, ' ')
      .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/giu, '\n')
      .replace(/<[^>]+>/gu, ' '),
  )
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, '')
    .replace(/[ \t]+/gu, ' ')
    .replace(/ *\n */gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

export function gmailHeader(message: GmailMessage, name: string): string | null {
  const header = message.payload?.headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  return typeof header?.value === 'string' ? header.value.trim() : null;
}

function isAttachment(part: GmailMessagePart): boolean {
  if (part.filename?.trim()) return true;
  const disposition = part.headers?.find((header) => header.name?.toLowerCase() === 'content-disposition')?.value;
  return typeof disposition === 'string' && /\battachment\b/iu.test(disposition);
}

type AttachmentLoader = (messageId: string, attachmentId: string) => Promise<string>;

function partCharset(part: GmailMessagePart): string {
  const contentType = part.headers?.find((header) => header.name?.toLowerCase() === 'content-type')?.value ?? '';
  const charset = /charset\s*=\s*["']?([^;"'\s]+)/iu.exec(contentType)?.[1]?.toLowerCase();
  const allowed = new Set(['utf-8', 'utf8', 'iso-2022-jp', 'shift_jis', 'shift-jis', 'sjis', 'windows-1252', 'us-ascii']);
  return charset && allowed.has(charset) ? charset : 'utf-8';
}

function decodePart(bytes: Uint8Array, part: GmailMessagePart): string {
  try {
    return new TextDecoder(partCharset(part), { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}

export async function extractGmailMessageText(
  message: GmailMessage,
  loadAttachment?: AttachmentLoader,
): Promise<string> {
  if (!message.payload || !message.id) return '';
  const plain: string[] = [];
  const html: string[] = [];
  let visited = 0;
  let decodedBytes = 0;

  async function visit(part: GmailMessagePart, depth: number): Promise<void> {
    visited += 1;
    if (depth > MAX_DEPTH || visited > MAX_PARTS || isAttachment(part)) return;
    const mimeType = part.mimeType?.toLowerCase().split(';', 1)[0] ?? '';
    if (mimeType === 'multipart/alternative') {
      const beforePlain = plain.length;
      for (const child of (part.parts ?? []).filter((item) => item.mimeType?.toLowerCase().startsWith('text/plain'))) {
        await visit(child, depth + 1);
      }
      if (plain.length > beforePlain) return;
      for (const child of part.parts ?? []) await visit(child, depth + 1);
      return;
    }
    if (mimeType === 'text/plain' || mimeType === 'text/html') {
      let data = part.body?.data;
      if (!data && part.body?.attachmentId && loadAttachment && message.id) {
        if ((part.body.size ?? 0) > MAX_DECODED_BYTES - decodedBytes) return;
        data = await loadAttachment(message.id, part.body.attachmentId);
      }
      if (data) {
        const remaining = MAX_DECODED_BYTES - decodedBytes;
        if (remaining <= 0) return;
        const bytes = decodeBase64Url(data, remaining);
        decodedBytes += bytes.length;
        const text = decodePart(bytes, part);
        if (mimeType === 'text/plain') plain.push(text);
        else html.push(htmlToSafeText(text));
      }
      return;
    }
    for (const child of part.parts ?? []) await visit(child, depth + 1);
  }

  await visit(message.payload, 0);
  const selected = plain.length ? plain : html;
  return selected.join('\n').replace(/\n{3,}/gu, '\n\n').trim().slice(0, MAX_DECODED_BYTES);
}
