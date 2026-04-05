import ExcelJS from 'exceljs';

export type ExcelColumn = {
  key: string;
  header: string;
  width?: number;
};

export type BuildWorkbookOptions = {
  title: string;
  sheetName?: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  formatters?: Partial<Record<string, (v: unknown) => string | number>>;
  /** Return ARGB without leading FF for cell fill (e.g. FEE2E2 for red tint). */
  cellFillArgb?: (ctx: {
    rowIndex: number;
    colKey: string;
    value: unknown;
  }) => string | undefined;
};

const HEADER_BG = 'FF1E40AF';
const HEADER_FG = 'FFFFFFFF';
const ZEBRA = 'FFF1F5F9';

export async function buildWorkbook(opts: BuildWorkbookOptions): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(opts.sheetName ?? opts.title, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = opts.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
  }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: HEADER_FG } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_BG },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  opts.rows.forEach((row, idx) => {
    const plain: Record<string, unknown> = {};
    for (const col of opts.columns) {
      let v = row[col.key];
      const fmt = opts.formatters?.[col.key];
      if (fmt) v = fmt(v);
      plain[col.key] = v ?? '';
    }
    const r = ws.addRow(plain);
    if (idx % 2 === 1) {
      r.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: ZEBRA },
        };
      });
    }
    r.eachCell((cell, colNumber) => {
      const col = opts.columns[colNumber - 1];
      if (col && opts.cellFillArgb) {
        const argb = opts.cellFillArgb({
          rowIndex: idx + 2,
          colKey: col.key,
          value: plain[col.key],
        });
        if (argb) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: `FF${argb}` },
          };
        }
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: opts.columns.length },
  };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
