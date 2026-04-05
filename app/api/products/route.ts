import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { parsePagination, parseSort } from '@/lib/api/query';
import { createProduct, listProducts } from '@/lib/services/product.service';
import { CreateProductSchema } from '@/lib/validations/product';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePagination(sp);
  const { sortBy, sortOrder } = parseSort(sp);

  try {
    const { items, total } = await listProducts(session, {
      page,
      pageSize,
      search: sp.get('search') ?? undefined,
      category: sp.get('category') ?? undefined,
      manufacturer: sp.get('manufacturer') ?? undefined,
      stock: sp.get('stock') ?? undefined,
      isActive: sp.get('isActive') ?? undefined,
      sortBy,
      sortOrder,
    });
    return jsonSuccess(items, { total, page, pageSize });
  } catch (e) {
    console.error(e);
    return jsonError('Failed to list products', 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  try {
    const created = await createProduct(session, parsed.data);
    return jsonSuccess(created, undefined, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError('Failed to create product', 500);
  }
}
