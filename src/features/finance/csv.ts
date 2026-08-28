export function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function mapBankCsv(text: string, columns: { date: string; amount: string; reference: string; description: string }) {
  const [headers = [], ...rows] = parseCsv(text); const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  for (const required of [columns.date, columns.amount, columns.description]) if (index[required] === undefined) throw new Error(`Missing column: ${required}`);
  return rows.map((row) => ({ date: row[index[columns.date]] ?? "", amount: row[index[columns.amount]] ?? "", reference: columns.reference ? row[index[columns.reference]] ?? "" : "", description: row[index[columns.description]] ?? "" }));
}
