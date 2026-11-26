import he from 'he';

/**
 * Parse phpMyAdmin-style INSERT VALUES for `entries`.
 */
export function parseEntriesDump(sql) {
  const marker = 'INSERT INTO `entries`';
  const start = sql.indexOf(marker);
  if (start < 0) throw new Error('No INSERT INTO entries found in dump');
  const valuesIdx = sql.indexOf('VALUES', start);
  const end = sql.indexOf(';\n', valuesIdx);
  const endAlt = sql.indexOf(';', valuesIdx);
  const cut = end > 0 ? end : endAlt;
  const valuesBlob = sql.slice(valuesIdx + 'VALUES'.length, cut).trim();

  const rows = [];
  let i = 0;

  function skipWs() {
    while (i < valuesBlob.length && /\s/.test(valuesBlob[i])) i++;
  }

  function readValue() {
    skipWs();
    if (valuesBlob.startsWith('NULL', i) && !/[A-Za-z0-9_]/.test(valuesBlob[i + 4] || '')) {
      i += 4;
      return null;
    }
    if (valuesBlob[i] === "'") {
      i++;
      let s = '';
      while (i < valuesBlob.length) {
        const ch = valuesBlob[i];
        if (ch === '\\') {
          const next = valuesBlob[i + 1];
          if (next === 'n') {
            s += '\n';
            i += 2;
            continue;
          }
          if (next === 'r') {
            s += '\r';
            i += 2;
            continue;
          }
          if (next === 't') {
            s += '\t';
            i += 2;
            continue;
          }
          if (next === "'" || next === '\\' || next === '"') {
            s += next;
            i += 2;
            continue;
          }
          s += next;
          i += 2;
          continue;
        }
        if (ch === "'" && valuesBlob[i + 1] === "'") {
          s += "'";
          i += 2;
          continue;
        }
        if (ch === "'") {
          i++;
          break;
        }
        s += ch;
        i++;
      }
      return s;
    }
    // number
    let num = '';
    while (i < valuesBlob.length && /[0-9.eE+-]/.test(valuesBlob[i])) {
      num += valuesBlob[i++];
    }
    if (!num) throw new Error(`Unexpected token near: ${valuesBlob.slice(i, i + 40)}`);
    return num.includes('.') ? Number(num) : Number(num);
  }

  while (i < valuesBlob.length) {
    skipWs();
    if (i >= valuesBlob.length) break;
    if (valuesBlob[i] === ',') {
      i++;
      continue;
    }
    if (valuesBlob[i] !== '(') break;
    i++;
    const fields = [];
    while (true) {
      fields.push(readValue());
      skipWs();
      if (valuesBlob[i] === ',') {
        i++;
        continue;
      }
      if (valuesBlob[i] === ')') {
        i++;
        break;
      }
      throw new Error(`Expected , or ) near: ${valuesBlob.slice(i, i + 40)}`);
    }
    if (fields.length >= 21) rows.push(fields);
  }
  return rows;
}

export function normalizeHeight(cm) {
  const n = Number(cm);
  if (!Number.isFinite(n)) return 160;
  if (n > 0 && n < 100) return Math.round(n * 2.54);
  return Math.min(220, Math.max(120, Math.round(n)));
}

export function unescapeHtml(s) {
  if (s == null) return s;
  return he.decode(String(s));
}
