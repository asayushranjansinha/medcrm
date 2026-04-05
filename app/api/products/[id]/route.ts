import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { getProductById, updateProduct } from '@/lib/services/product.service';
import { UpdateProductSchema } from '@/lib/validations/product';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  const product = await getProductById(session, id);
  if (!product) return jsonError('Not found', 404);
  return jsonSuccess(product);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  const updated = await updateProduct(session, id, parsed.data);
  if (!updated) return jsonError('Not found', 404);
  return jsonSuccess(updated);
}
