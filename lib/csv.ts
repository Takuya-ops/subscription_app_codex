export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

export function parseCsvStrict(input: string): string[][] {
  const text = input.startsWith('\uFEFF') ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let quoteClosed = false;

  const pushCell = () => {
    row.push(cell.trim());
    cell = '';
    quoteClosed = false;
  };
  const pushRow = () => {
    pushCell();
    if (row.some((value) => value.length > 0)) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      if (cell.length > 0 || quoteClosed) throw new CsvParseError('CSVの引用符の位置が正しくありません');
      inQuotes = true;
    } else if (char === ',') {
      pushCell();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      pushRow();
    } else if (quoteClosed) {
      if (!/\s/.test(char)) throw new CsvParseError('CSVの引用符の後に不正な文字があります');
    } else {
      cell += char;
    }
  }

  if (inQuotes) throw new CsvParseError('CSVの引用符が閉じられていません');
  if (row.length > 0 || cell.length > 0 || quoteClosed) pushRow();
  if (!rows.length) return rows;

  const columnCount = rows[0].length;
  rows.forEach((current, index) => {
    if (current.length !== columnCount) {
      throw new CsvParseError(`${index + 1}行目の列数がヘッダーと一致しません`);
    }
  });
  return rows;
}
