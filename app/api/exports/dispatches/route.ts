import { NextRequest } from 'next/server';
import { format } from 'date-fns';
import { getSessionUser } from '@/lib/api/session';
import { parseSort } from '@/lib/api/query';
import { buildWorkbook } from '@/lib/exports/excel';
import { listDispatches } from '@/lib/services/dispatch.service';

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

  const { items } = await listDispatches(session, {
    page: 1,
    pageSize: 20_000,
    search: sp.get('search') ?? undefined,
    dateFrom: sp.get('dateFrom') ?? undefined,
    dateTo: sp.get('dateTo') ?? undefined,
    productId: sp.get('productId') ?? undefined,
    personId: sp.get('personId') ?? undefined,
    dispatchType: sp.get('dispatchType') ?? undefined,
    movementType: sp.get('movementType') ?? undefined,
    status: sp.get('status') ?? undefined,
    userId: sp.get('userId') ?? undefined,
    sortBy,
    sortOrder,
  });

  const columns = [
    { key: 'sno', header: 'S.No', width: 6 },
    { key: 'productName', header: 'Product Name', width: 22 },
    { key: 'genericName', header: 'Generic Name', width: 22 },
    { key: 'productCategory', header: 'Category', width: 12 },
    { key: 'personName', header: 'Recipient HCP', width: 22 },
    { key: 'personCity', header: 'HCP City', width: 14 },
    { key: 'dispatchedBy', header: 'Dispatched By', width: 20 },
    { key: 'dispatchType', header: 'Dispatch Type', width: 14 },
    { key: 'quantity', header: 'Quantity', width: 10 },
    { key: 'batchNumber', header: 'Batch No', width: 14 },
    { key: 'dispatchDate', header: 'Dispatch Date', width: 14 },
    { key: 'expectedDelivery', header: 'Expected Delivery', width: 16 },
    { key: 'actualDelivery', header: 'Actual Delivery', width: 16 },
    { key: 'status', header: 'Status', width: 12 },
    { key: 'invoiceNumber', header: 'Invoice No', width: 14 },
    { key: 'totalValue', header: 'Total Value', width: 12 },
    { key: 'remarks', header: 'Remarks', width: 28 },
  ];

  const rows = items.map((d, i) => ({
    sno: i + 1,
    productName: d.productName,
    genericName: d.genericName,
    productCategory: d.productCategory,
    personName: d.personName,
    personCity: d.personCity,
    dispatchedBy: d.dispatchedByName ?? '',
    dispatchType: d.dispatchType,
    quantity: d.quantity,
    batchNumber: d.batchNumber ?? '',
    dispatchDate: format(d.dispatchDate, 'yyyy-MM-dd'),
    expectedDelivery: d.expectedDeliveryDate ? format(d.expectedDeliveryDate, 'yyyy-MM-dd') : '',
    actualDelivery: d.actualDeliveryDate ? format(d.actualDeliveryDate, 'yyyy-MM-dd') : '',
    status: d.status,
    invoiceNumber: d.invoiceNumber ?? '',
    totalValue: d.totalValue ?? '',
    remarks: d.remarks ?? '',
  }));

  const buffer = await buildWorkbook({
    title: 'Dispatches',
    sheetName: 'Dispatches',
    columns,
    rows,
  });

  const fname = `dispatches_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
