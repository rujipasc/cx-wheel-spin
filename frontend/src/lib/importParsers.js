function parseDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current);
  return cells;
}

function detectDelimiter(lines) {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestScore = -1;

  for (const delimiter of candidates) {
    const score = lines
      .slice(0, 6)
      .map((line) => parseDelimitedLine(line, delimiter).length)
      .reduce((sum, cols) => sum + cols, 0);

    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }
  return best;
}

export function parseCsvToRows(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0);

  const delimiter = detectDelimiter(lines);
  return lines.map((line) => parseDelimitedLine(line, delimiter));
}

export function extractNameColumn(rows, columnIndex = 0, skipHeader = true) {
  const source = skipHeader ? rows.slice(1) : rows;
  return source.map((row) => row[columnIndex] ?? "");
}
