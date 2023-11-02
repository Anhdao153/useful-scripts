function commons() {
  // Get sheet by name
  const sheet = SpreadsheetApp.getActive().getSheetByName("SHEET_NAME");
  // Get last row of sheet
  const lastRow = sheet.getLastRow();

  // Get last column of sheet
  const lastColumn = sheet.getLastColumn();
}

// Highlight (bold) substring in cell
function highlight(cell, highlightText) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("SHEET_NAME");
  const targetCellValue = sheet.getRange(cell).getValue();
  const boldFormat = SpreadsheetApp.newTextStyle().setBold(true).build();
  const richText = SpreadsheetApp.newRichTextValue().setText(targetCellValue);

  let start = targetCellValue.indexOf(highlightText);
  while( start >= 0 ){
    console.log('found:' + start + '-' + (start + highlightText.length));
    richText.setTextStyle(start, start + highlightText.length, boldFormat);
    start = targetCellValue.indexOf(highlightText, start + highlightText.length);
  }

  sheet.getRange(cell).setRichTextValue(richText.build());
}
