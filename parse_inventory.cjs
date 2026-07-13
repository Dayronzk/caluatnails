const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('/Users/dayronhernandez/Downloads/En blanco.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const brands = ["Bella vida", "HEY", "Staly", "Magic", "Nailox", "OPI", "Victoria Vynn", "Passione Nails", "A-Nail", "Mia Secret", "Kinetics"];
const categories = [
  { name: "Limas y Pulidoras", keywords: ["lima", "pulidora", "podo disco", "disco"] },
  { name: "Herramientas", keywords: ["cortacuticulas", "corta uñas", "empujador", "pinza", "puntas"] },
  { name: "Desechables", keywords: ["guantes", "tapa bocas", "bolsa", "celulosas", "pañuelos", "paños", "algodón", "desechable"] },
  { name: "Líquidos y Aceites", keywords: ["aceite", "exfoliante", "cleaners", "talco", "polvo"] },
  { name: "Accesorios", keywords: ["imán", "brochas", "filtro", "rollo"] },
  { name: "Materiales Técnicos", keywords: ["acrylic-gel", "gel", "acrilico"] }
];

const items = [];
let currentProduct = '';

for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;

  let name = row[1];
  let col2 = row[2] ? String(row[2]).trim() : '';
  let col3 = row[3] ? String(row[3]).trim() : '';
  
  if (name && String(name).trim() !== '') {
    currentProduct = String(name).trim();
  } else {
    name = currentProduct;
  }

  // Build full name
  let fullName = currentProduct;
  if (col2 && col2 !== fullName) fullName += ' ' + col2;
  if (col3) fullName += ' ' + col3;
  fullName = fullName.trim();

  let reserva = row[4];
  let enUso = row[5];

  if (!reserva && !enUso) continue;

  // Detect Brand
  let detectedBrand = "";
  for (const b of brands) {
    if (fullName.toLowerCase().includes(b.toLowerCase())) {
      detectedBrand = b;
      break;
    }
  }

  // Detect Category
  let detectedCategory = "Otros";
  for (const cat of categories) {
    if (cat.keywords.some(k => fullName.toLowerCase().includes(k))) {
      detectedCategory = cat.name;
      break;
    }
  }

  // Determine Type (Insumo vs Herramienta)
  let type = "insumo";
  if (detectedCategory === "Herramientas" || fullName.toLowerCase().includes("máquina")) {
    type = "herramienta";
  }

  // Parse Quantity and Unit
  let qty = 0;
  let unit = 'unidades';

  if (reserva) {
    const str = String(reserva).trim().toLowerCase();
    const match = str.match(/([\d\.]+)\s*(.*)/);
    if (match) {
      qty = parseFloat(match[1]) || 0;
      if (match[2]) {
        unit = match[2].replace('paquete', 'paquetes').replace('caja', 'cajas').trim();
      }
    } else {
      qty = parseFloat(reserva) || 0;
    }
  } else if (enUso) {
    qty = parseFloat(enUso) || 0;
  }

  if (qty > 0) {
    items.push({
      name: fullName,
      type: type,
      category: detectedCategory,
      brand: detectedBrand || "Genérico",
      quantity: qty,
      unit: unit,
      min_stock: 0
    });
  }
}

fs.writeFileSync('parsed_inventory_improved.json', JSON.stringify(items, null, 2));
console.log(`Parsed ${items.length} items with improvements.`);
