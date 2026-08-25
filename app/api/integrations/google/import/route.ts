import { apiUser, errorResponse, isSameOrigin, readJsonBody } from '@/app/api/api-helpers';
import { GmailCandidateError, importGmailCandidates } from '@/db/gmail-store';
import { ensureSchema } from '@/db/runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = await readJsonBody(request, 16_000);
  if (body.error) return body.error;
  const candidateIds = body.value && typeof body.value === 'object'
    ? (body.value as { candidateIds?: unknown }).candidateIds
    : null;
  if (!Array.isArray(candidateIds) || candidateIds.length < 1 || candidateIds.length > 10) {
    return errorResponse('1〜10件の候補を選択してください', 400);
  }
  if (!candidateIds.every((id) => typeof id === 'string' && /^[0-9a-f-]{36}$/iu.test(id))) {
    return errorResponse('候補IDを確認してください', 400);
  }
  try {
    const result = await importGmailCandidates(await ensureSchema(), user.userId, candidateIds as string[]);
    return Response.json(result, { status: 201, headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(
      error instanceof GmailCandidateError ? error.message : '候補を登録できませんでした',
      error instanceof GmailCandidateError ? 409 : 500,
    );
  }
}
