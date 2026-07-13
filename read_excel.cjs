const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/dayronhernandez/Downloads/En blanco.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log("Columns found:", Object.keys(data[0] || {}));
console.log("First 2 rows:", data.slice(0, 2));
