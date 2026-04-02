const SHEET_NAME = 'Requests';
const EMPLOYEES_SHEET = 'Employees';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getRequests') {
    return getRequests();
  } else if (action === 'getEmployees') {
    return getEmployees();
  } else if (action === 'getNextId') {
    return getNextId();
  }

  return jsonResponse({ error: 'Invalid action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'addRequest') {
    return addRequest(data);
  } else if (action === 'updateRequest') {
    return updateRequest(data);
  } else if (action === 'addEmployee') {
    return addEmployee(data);
  } else if (action === 'removeEmployee') {
    return removeEmployee(data);
  }

  return jsonResponse({ error: 'Invalid action' });
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let reqSheet = ss.getSheetByName(SHEET_NAME);
  if (!reqSheet) {
    reqSheet = ss.insertSheet(SHEET_NAME);
    reqSheet.appendRow([
      'ID', 'Date', 'Building', 'Description', 'Priority',
      'AssignedTo', 'Status', 'ActionTaken', 'CreatedBy',
      'CreatedDate', 'ModifiedBy', 'ModifiedDate'
    ]);
  }

  let empSheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!empSheet) {
    empSheet = ss.insertSheet(EMPLOYEES_SHEET);
    empSheet.appendRow(['Name']);
  }
}

function getRequests() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse([]);

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  const requests = data.map(row => ({
    id: row[0],
    date: row[1],
    building: row[2],
    description: row[3],
    priority: row[4],
    assignedTo: row[5],
    status: row[6],
    actionTaken: row[7],
    createdBy: row[8],
    createdDate: row[9],
    modifiedBy: row[10],
    modifiedDate: row[11]
  }));

  return jsonResponse(requests);
}

function getEmployees() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse([]);

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  return jsonResponse(data.map(row => row[0]).filter(n => n));
}

function getNextId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ nextId: 1 });

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const max = Math.max(...ids.map(r => Number(r[0]) || 0));
  return jsonResponse({ nextId: max + 1 });
}

function addRequest(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const now = new Date().toISOString();

  sheet.appendRow([
    data.id, data.date, data.building, data.description,
    data.priority, data.assignedTo, data.status, data.actionTaken || '',
    data.createdBy, now, data.createdBy, now
  ]);

  return jsonResponse({ success: true });
}

function updateRequest(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  const now = new Date().toISOString();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      const row = i + 2;
      if (data.status) sheet.getRange(row, 7).setValue(data.status);
      if (data.actionTaken) sheet.getRange(row, 8).setValue(data.actionTaken);
      if (data.assignedTo) sheet.getRange(row, 6).setValue(data.assignedTo);
      if (data.priority) sheet.getRange(row, 5).setValue(data.priority);
      if (data.building) sheet.getRange(row, 3).setValue(data.building);
      if (data.description) sheet.getRange(row, 4).setValue(data.description);
      sheet.getRange(row, 11).setValue(data.modifiedBy);
      sheet.getRange(row, 12).setValue(now);
      return jsonResponse({ success: true });
    }
  }

  return jsonResponse({ error: 'Request not found' });
}

function addEmployee(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  sheet.appendRow([data.name]);
  return jsonResponse({ success: true });
}

function removeEmployee(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === data.name) {
      sheet.deleteRow(i + 2);
      return jsonResponse({ success: true });
    }
  }

  return jsonResponse({ error: 'Employee not found' });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
