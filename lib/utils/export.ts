// ── CSV export ────────────────────────────────────────────────────────────────

export function exportToCSV(
  rows: Record<string, string | number>[],
  filename: string
) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escape  = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}