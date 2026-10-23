/**
 * Kuivaus- ja varastokirjanpito – Google Apps Script -backend (EI KÄYTÖSSÄ v1:ssä).
 * Sovellus lähettää POSTina koko taulut (kuormat, erat, siirrot, tapahtumat).
 * Skripti tekee upsertin id-sarakkeen perusteella omaan taulukkoonsa, joten
 * uudelleenlähetys (offline-jono) on turvallinen. Rivejä ei poisteta: kumotut rivit
 * merkitään sarakkeeseen "poistettu" = TRUE.
 */
const TABLES = ['kuormat', 'erat', 'siirrot', 'tapahtumat'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    TABLES.forEach(t => upsert_(ss, t, (data.tables && data.tables[t]) || []));
    log_(ss, data.ops || 0);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return json_({ ok: true, info: 'Kuivaus-backend' }); }

function upsert_(ss, name, rows) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  let values = sh.getDataRange().getValues();
  let header = values[0] && values[0][0] !== '' ? values[0].map(String) : ['id'];
  rows.forEach(r => Object.keys(r).forEach(k => { if (header.indexOf(k) < 0) header.push(k); }));
  if (header.indexOf('poistettu') < 0) header.push('poistettu');
  const existing = values.slice(1);
  const idx = {};
  existing.forEach((row, i) => { idx[row[0]] = i; });
  const incoming = {};
  rows.forEach(r => { incoming[r.id] = true; });
  const out = existing.map(row => { const a = header.map((_, j) => row[j] === undefined ? '' : row[j]); return a; });
  rows.forEach(r => {
    const line = header.map(h => h === 'poistettu' ? false : (r[h] === undefined ? '' : r[h]));
    if (idx[r.id] !== undefined) out[idx[r.id]] = line; else out.push(line);
  });
  const pi = header.indexOf('poistettu');
  out.forEach(row => { if (!incoming[row[0]]) row[pi] = true; });
  sh.clearContents();
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
  if (out.length) sh.getRange(2, 1, out.length, header.length).setValues(out);
  sh.setFrozenRows(1);
}

function log_(ss, ops) {
  const sh = ss.getSheetByName('synkkaloki') || ss.insertSheet('synkkaloki');
  sh.appendRow([new Date(), ops]);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
