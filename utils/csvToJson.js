const fs = require('fs');
const csv = require('csv-parser');

// Replace 'input.csv' with the path to your CSV file.
const csvFilePath = 'input.csv';
const outputFilePath = 'output.json';

// Replace 'keyField' with the name of the field you want to use as the key.
const keyField = 'your_key_field';

const jsonOutput = {};

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const key = row[keyField];
    delete row[keyField]; // Remove the key field from the object.
    jsonOutput[key] = row;
  })
  .on('end', () => {
    const jsonString = JSON.stringify(jsonOutput, null, 2);

    fs.writeFile(outputFilePath, jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      } else {
        console.log('JSON file has been created successfully.');
      }
    });
  });
