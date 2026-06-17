/**
 * Formats a Date object to DD/MM/YYYY string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string in DD/MM/YYYY format.
 */
function formatDate(date) {
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();

  var dayStr = day < 10 ? '0' + day : '' + day;
  var monthStr = month < 10 ? '0' + month : '' + month;

  return dayStr + '/' + monthStr + '/' + year;
}

/**
 * Calculates the subscription end date by adding one calendar month to the start date.
 * Clamps to the last day of the target month when day overflow occurs.
 * E.g., Jan 31 → Feb 28 (or Feb 29 in leap year), Mar 31 → Apr 30.
 * @param {Date} startDate - The subscription start date.
 * @returns {Date} The calculated end date.
 */
function calculateEndDate(startDate) {
  var originalDay = startDate.getDate();

  var endDate = new Date(startDate.getTime());
  endDate.setMonth(endDate.getMonth() + 1);

  // If the day changed, overflow occurred (e.g., Jan 31 + 1 month → Mar 3).
  // Set day to 0 of the overflowed month to get the last day of the target month.
  if (endDate.getDate() !== originalDay) {
    endDate.setDate(0);
  }

  return endDate;
}

/**
 * Checks if a UTR/Transaction ID already exists in column F of the active sheet.
 * Performs a case-insensitive comparison.
 * @param {string} utrId - The UTR/Transaction ID to check.
 * @returns {boolean} True if a matching UTR already exists, false otherwise.
 */
function isDuplicate(utrId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();

  // No data rows (only header or empty sheet)
  if (lastRow <= 1) {
    return false;
  }

  // Read column F (UTR/Transaction ID), starting from row 2 to skip header
  var range = sheet.getRange(2, 6, lastRow - 1, 1);
  var values = range.getValues();

  var utrLower = utrId.toLowerCase();

  for (var i = 0; i < values.length; i++) {
    var existingUtr = values[i][0];
    if (existingUtr && existingUtr.toString().toLowerCase() === utrLower) {
      return true;
    }
  }

  return false;
}

/**
 * Handles incoming POST requests to the web app.
 * Parses the JSON payload, validates fields, checks for duplicates,
 * calculates subscription dates, and appends a record to the sheet.
 * @param {Object} e - The event object from the web app POST request.
 * @returns {TextOutput} JSON response with status and message.
 */
function doPost(e) {
  var response;

  try {
    // Parse the JSON payload
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      response = { status: 'error', message: 'Invalid payload' };
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Validate required fields
    var requiredFields = ['firstName', 'lastName', 'email', 'selectedPlan', 'utrId', 'submissionTimestamp'];
    for (var i = 0; i < requiredFields.length; i++) {
      var field = requiredFields[i];
      if (!data[field] && data[field] !== 0) {
        response = { status: 'error', message: 'Missing required field: ' + field };
        return ContentService.createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Check for duplicate UTR
    if (isDuplicate(data.utrId)) {
      response = { status: 'duplicate', message: 'UTR already exists' };
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Parse submission timestamp and calculate dates
    var submissionDate = new Date(data.submissionTimestamp);
    var startDateStr = formatDate(submissionDate);
    var endDate = calculateEndDate(submissionDate);
    var endDateStr = formatDate(endDate);

    // Append row to the sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.submissionTimestamp,  // Timestamp (ISO string)
      data.firstName,            // First Name
      data.lastName,             // Last Name
      data.email,                // Email
      data.selectedPlan,         // Selected Plan
      data.utrId,                // UTR/Transaction ID
      startDateStr,              // Subscription Start Date (DD/MM/YYYY)
      endDateStr,                // Subscription End Date (DD/MM/YYYY)
      'Active'                   // Subscription Status
    ]);

    response = { status: 'success', message: 'Record added successfully' };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    response = { status: 'error', message: 'Failed to write: ' + error.message };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
