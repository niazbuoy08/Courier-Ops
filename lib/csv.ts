/**
 * Minimal RFC 4180 CSV serializer. A cell is quoted only when it contains a
 * comma, a quote, or a newline; embedded quotes are doubled. Rows are joined
 * with CRLF, which every spreadsheet accepts.
 */

type CsvValue = string | number | boolean | null | undefined;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv<T>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
): string {
  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(","),
  );
  return [header, ...body].join("\r\n");
}
