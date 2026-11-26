// Project name: VLS DOP Registration Intake
// Script Properties: SPREADSHEET_ID, INTAKE_TOKEN (random secret, 32+ characters).
const HEADERS = ['Request ID', 'Received at', 'Full name', 'Mobile number', 'Email address', 'Professional status', 'Contact consent', 'Marketing consent', 'Variant', 'Payload hash'];

function setup() {
  const p = PropertiesService.getScriptProperties();
  const book = SpreadsheetApp.openById(p.getProperty('SPREADSHEET_ID'));
  const sheet = book.getSheetByName('Registrations') || book.insertSheet('Registrations');
  if (!sheet.getLastRow()) sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const p = PropertiesService.getScriptProperties();
    const secret = p.getProperty('INTAKE_TOKEN');
    if (!secret || secret.length < 32) return reply({accepted: false, code: 'NOT_CONFIGURED'});
    if (!e || !e.postData || e.postData.contents.length > 16384) return reply({accepted: false, code: 'INVALID_REQUEST'});
    const input = JSON.parse(e.postData.contents);
    if (input.token !== secret) return reply({accepted: false, code: 'UNAUTHORIZED'});
    const lead = input.lead || {};
    const name = String(lead.fullName || '').trim();
    const phone = String(lead.phone || '').trim();
    const email = String(lead.email || '').trim();
    const status = String(lead.status || '').trim();
    const statuses = ['Pursuing LLB', 'Final-year student', 'Law graduate', 'Junior advocate', 'Practising advocate', 'Returning to legal practice', 'Other'];
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.requestId || '') || name.length < 2 || name.length > 100 || !/^\+[1-9]\d{7,14}$/.test(phone) || email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) || statuses.indexOf(status) < 0 || lead.consent !== true) return reply({accepted: false, code: 'VALIDATION_FAILED'});
    const values = [name, phone, email, status, true, lead.marketingConsent === true, /^[A-E]$/.test(lead.variant) ? lead.variant : 'A'];
    const hash = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(values)));
    lock.waitLock(10000);
    locked = true;
    const sheet = SpreadsheetApp.openById(p.getProperty('SPREADSHEET_ID')).getSheetByName('Registrations');
    if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) return reply({accepted: false, code: 'RUN_SETUP'});
    const rows = sheet.getLastRow();
    const existing = rows > 1 ? sheet.getRange(2, 1, rows - 1, 1).createTextFinder(input.requestId).matchEntireCell(true).findNext() : null;
    if (existing) return sheet.getRange(existing.getRow(), 10).getValue() === hash ? reply({accepted: true, requestId: input.requestId, duplicate: true}) : reply({accepted: false, code: 'IDEMPOTENCY_CONFLICT'});
    // Treat user input as text, including phone '+' and spreadsheet formula prefixes.
    const safe = value => typeof value === 'string' && /^[=+@\-\s]/.test(value) ? "'" + value : value;
    sheet.appendRow([input.requestId, new Date().toISOString()].concat(values.map(safe), [hash]));
    SpreadsheetApp.flush();
    return reply({accepted: true, requestId: input.requestId, duplicate: false});
  } catch (_) {
    return reply({accepted: false, code: 'SAVE_FAILED'});
  } finally {
    if (locked) lock.releaseLock();
  }
}
