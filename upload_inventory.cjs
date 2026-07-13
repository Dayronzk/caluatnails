const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const brands = ["Bella vida", "HEY", "Staly", "Magic", "Nailox", "OPI", "Victoria Vynn", "Passione Nails", "A-Nail", "Mia Secret", "Kinetics", "DNKA", "MASGLO"];
const categories = [
  { name: "Limas y Pulidoras", keywords: ["lima", "pulidora", "podo disco", "disco"] },
  { name: "Herramientas", keywords: ["cortacuticulas", "corta uñas", "empujador", "pinza", "puntas"] },
  { name: "Desechables", keywords: ["guantes", "tapa bocas", "bolsa", "celulosas", "pañuelos", "paños", "algodón", "desechable"] },
  { name: "Líquidos y Aceites", keywords: ["aceite", "exfoliante", "cleaners", "talco", "polvo"] },
  { name: "Accesorios", keywords: ["imán", "brochas", "filtro", "rollo"] },
  { name: "Materiales Técnicos", keywords: ["acrylic-gel", "gel", "acrilico"] }
];

async function improveAndUpload() {
  try {
    const rawData = JSON.parse(fs.readFileSync('parsed_inventory.json', 'utf8'));
    console.log(`Procesando ${rawData.length} artículos existentes...`);

    const improvedData = rawData.map(item => {
      const fullName = item.name;
      
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

      // Determine Type
      let type = "insumo";
      if (detectedCategory === "Herramientas" || fullName.toLowerCase().includes("máquina")) {
        type = "herramienta";
      }

      return {
        name: fullName,
        type: type,
        category: detectedCategory,
        brand: detectedBrand || "Genérico",
        quantity: item.quantity,
        unit: item.unit,
        min_stock: 2,
        active: true
      };
    });

    // 1. Limpiar todos los registros previos para evitar duplicados
    console.log('Limpiando todos los registros de inventario previos...');
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina todo

    // 2. Insertar datos mejorados en lotes
    const batchSize = 50;
    for (let i = 0; i < improvedData.length; i += batchSize) {
      const batch = improvedData.slice(i, i + batchSize);
      console.log(`Insertando lote mejorado ${Math.floor(i / batchSize) + 1}...`);
      
      const { error } = await supabase
        .from('inventory')
        .insert(batch);

      if (error) {
        console.error('Error al insertar lote:', error.message);
      }
    }

    console.log('✅ Inventario mejorado y cargado con éxito.');
  } catch (err) {
    console.error('Error durante la carga:', err.message);
  }
}

improveAndUpload();
