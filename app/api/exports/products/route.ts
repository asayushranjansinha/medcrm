import { NextRequest } from 'next/server';
import { format } from 'date-fns';
import { getSessionUser } from '@/lib/api/session';
import { parseSort } from '@/lib/api/query';
import { buildWorkbook } from '@/lib/exports/excel';
import { listProducts } from '@/lib/services/product.service';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sp = req.nextUrl.searchParams;
  const { sortBy, sortOrder } = parseSort(sp);

  const { items } = await listProducts(session, {
    page: 1,
    pageSize: 20_000,
    search: sp.get('search') ?? undefined,
    category: sp.get('category') ?? undefined,
    manufacturer: sp.get('manufacturer') ?? undefined,
    stock: sp.get('stock') ?? undefined,
    isActive: sp.get('isActive') ?? undefined,
    sortBy,
    sortOrder,
  });

  const columns = [
    { key: 'sno', header: 'S.No', width: 6 },
    { key: 'name', header: 'Product Name', width: 22 },
    { key: 'genericName', header: 'Generic Name', width: 22 },
    { key: 'category', header: 'Category', width: 12 },
    { key: 'mrp', header: 'MRP', width: 10 },
    { key: 'ptr', header: 'PTR', width: 10 },
    { key: 'pts', header: 'PTS', width: 10 },
    { key: 'manufacturer', header: 'Manufacturer', width: 22 },
    { key: 'batchNumber', header: 'Batch No', width: 14 },
    { key: 'expiryDate', header: 'Expiry Date', width: 14 },
    { key: 'stockQty', header: 'Current Stock', width: 14 },
    { key: 'isActive', header: 'Active', width: 8 },
    { key: 'createdAt', header: 'Created Date', width: 14 },
  ];

  const rows = items.map((p, i) => ({
    sno: i + 1,
    name: p.name,
    genericName: p.genericName,
    category: p.category,
    mrp: p.mrp,
    ptr: p.ptr,
    pts: p.pts ?? '',
    manufacturer: p.manufacturer,
    batchNumber: p.batchNumber ?? '',
    expiryDate: p.expiryDate ? format(p.expiryDate, 'yyyy-MM-dd') : '',
    stockQty: p.stockQty,
    isActive: p.isActive ? 'Yes' : 'No',
    createdAt: format(p.createdAt, 'yyyy-MM-dd'),
  }));

  const buffer = await buildWorkbook({
    title: 'Products',
    sheetName: 'Products',
    columns,
    rows,
    cellFillArgb: ({ colKey, value }) => {
      if (colKey !== 'stockQty') return undefined;
      const n = typeof value === 'number' ? value : Number(value);
      if (n === 0) return 'FEE2E2';
      if (n > 0 && n < 10) return 'FEF3C7';
      return undefined;
    },
  });

  const fname = `products_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
