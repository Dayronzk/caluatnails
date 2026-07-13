const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/dayronhernandez/Downloads/En blanco.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

for(let i = 0; i < 20; i++) {
  if (data[i]) console.log(data[i]);
}
