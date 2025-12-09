const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const db = require("../database");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// =============================================
// CONSTANTS
// =============================================
const MIN_YEAR = 2012;
const MAX_YEAR = 2030;

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

// =============================================
// COLUMN NAME PATTERNS (supports ANY format)
// =============================================
const COLUMN_PATTERNS = {
  date: ['date', 'dt', 'day', 'dated'],
  production: [
    'productioncount', 'production', 'prod', 'prodcount',
    'cars', 'bodycount', 'body', 'Production Count', 
    'paintedcars', 'output', 'units', 'qty', 'quantity'
  ],
  electricity: [
    'electricityconsumption', 'electricity', 'elec', 'electric', 'kwh', 'power'
  ],
  cng: [
    'cngconsumption', 'cng', 'gas', 'scm', 'naturalgas'
  ],
  water: [
    'waterconsumption', 'water', 'h2o', 'waterm3'
  ],
  air: [
    'airconsumption', 'air', 'compressedair', 'airm3', 'compr'
  ],
  // Target columns for comparison
  electricityTarget: [
    'electricitytarget', 'electrictarget', 'electricitytargetpercar', 'electrictargetpercar', 
    'electricitytargetcar', 'electricityconsumptioncar', 'target', 'targetcar', 'targetkwh',
    'electricitytarget(kwh)', 'target(kwh)', 'targetkwh'
  ],
  waterTarget: [
    'watertarget', 'watertargetpercar', 'watertargetm3', 'targetm3water', 'targetwater', 'targetcar'
  ],
  cngTarget: [
    'cngtarget', 'cngtargetpercar', 'cngtargetscm', 'targetscmcng', 'targetcng', 'targetcar'
  ],
  airTarget: [
    'airtarget', 'airtargetpercar', 'airtargetm3', 'targetm3air', 'targetair', 'targetcar'
  ]
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

function isYearValid(year) {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

function normalizeColumnName(col) {
  if (!col) return '';
  return col.toString()
    .toLowerCase()
    .replace(/[\s_\-\.\/\(\)\[\]]+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isPerUnitColumn(col) {
  if (!col) return false;
  const lower = col.toString().toLowerCase();
  return (
    lower.includes('/car') || lower.includes('/ car') ||
    lower.includes('percar') || lower.includes('per car') ||
    lower.includes('/unit') || lower.includes('per unit') ||
    lower.includes('avg') || lower.includes('average')
  );
}

function findColumn(columns, patterns, excludePerUnit = true) {
  for (const col of columns) {
    if (excludePerUnit && isPerUnitColumn(col)) continue;
    const normalized = normalizeColumnName(col);
    for (const pattern of patterns) {
      if (normalized.includes(pattern) || normalized === pattern) {
        return col;
      }
    }
  }
  return null;
}

function cleanNumber(v) {
  if (v === null || v === undefined || v === "" || v === " " || v === "--" || v === "-") return 0;
  if (typeof v === "string") {
    if (v.includes("DIV") || v.includes("#") || v.includes("N/A") || v.includes("ERR")) return 0;
    v = v.replace(/,/g, "").replace(/\s/g, "");
  }
  const num = Number(v);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function excelSerialToDate(serial) {
  if (typeof serial !== "number" || serial < 1) return null;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const d = new Date(excelEpoch.getTime() + serial * 86400000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fixCentury(year) {
  if (year >= 1912 && year <= 1930) return year + 100;
  if (year >= 12 && year <= 30) return year + 2000;
  if (year >= 0 && year <= 11) return year + 2000;
  return year;
}

// =============================================
// YEAR DETECTION
// =============================================
function detectYearFromSheet(rows, sheetName) {
  const yearCounts = {};
  
  if (sheetName) {
    const sheetMatch = sheetName.match(/\b(201[2-9]|202[0-9]|2030)\b/);
    if (sheetMatch) return parseInt(sheetMatch[0]);
    const shortMatch = sheetName.match(/\b([1-3][0-9])\b/);
    if (shortMatch) {
      const yr = parseInt(shortMatch[0]);
      if (yr >= 12 && yr <= 30) return 2000 + yr;
    }
  }
  
  const sampleRows = rows.slice(0, Math.min(rows.length, 30));
  for (const row of sampleRows) {
    for (const value of Object.values(row)) {
      if (typeof value === "number" && value > 30000 && value < 60000) {
        const parsed = excelSerialToDate(value);
        if (parsed) {
          let year = fixCentury(parsed.year);
          if (isYearValid(year)) yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      }
      if (typeof value === "string") {
        const match4 = value.match(/\b(201[2-9]|202[0-9]|2030)\b/);
        if (match4) {
          yearCounts[parseInt(match4[0])] = (yearCounts[parseInt(match4[0])] || 0) + 1;
        }
        const match2 = value.match(/[-\/\.](1[2-9]|2[0-9]|30)$/);
        if (match2) {
          const yr = 2000 + parseInt(match2[1]);
          if (isYearValid(yr)) yearCounts[yr] = (yearCounts[yr] || 0) + 1;
        }
      }
    }
  }
  
  let bestYear = new Date().getFullYear();
  let maxCount = 0;
  for (const [yr, count] of Object.entries(yearCounts)) {
    if (count > maxCount) { maxCount = count; bestYear = parseInt(yr); }
  }
  return bestYear;
}

// =============================================
// DATE PARSER
// =============================================
function parseDate(raw, detectedYear) {
  if (!raw) return null;
  
  if (typeof raw === "number") {
    const d = excelSerialToDate(raw);
    if (!d) return null;
    let year = fixCentury(d.year);
    if (!isYearValid(year)) year = detectedYear;
    return formatDate(year, d.month, d.day);
  }
  
  if (typeof raw !== "string") return null;
  
  const txt = raw.trim();
  if (!txt) return null;
  
  const lower = txt.toLowerCase();
  if (lower.includes("total") || lower.includes("summary") || 
      lower.includes("week") || lower === "date" || 
      lower.includes("grand") || lower.includes("average")) {
    return null;
  }
  
  if (/^[A-Za-z]{3,9}[-\/\.]\d{2,4}$/.test(txt)) return null;
  
  // 1-Jan-24
  const dmyText = txt.match(/^(\d{1,2})[-\/\.]([A-Za-z]{3,9})[-\/\.](\d{2,4})$/i);
  if (dmyText) {
    const day = parseInt(dmyText[1]);
    const month = MONTH_MAP[dmyText[2].toLowerCase()];
    let year = parseInt(dmyText[3]);
    if (!month) return null;
    year = fixCentury(year);
    if (!isYearValid(year)) year = detectedYear;
    return formatDate(year, month, day);
  }
  
  // 01/01/2024
  const numDate = txt.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (numDate) {
    let p1 = parseInt(numDate[1]);
    let p2 = parseInt(numDate[2]);
    let year = parseInt(numDate[3]);
    year = fixCentury(year);
    if (!isYearValid(year)) year = detectedYear;
    let day, month;
    if (p1 > 12) { day = p1; month = p2; }
    else if (p2 > 12) { day = p2; month = p1; }
    else { day = p1; month = p2; }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return formatDate(year, month, day);
  }
  
  // 2024-01-01
  const isoDate = txt.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoDate) {
    let year = parseInt(isoDate[1]);
    year = fixCentury(year);
    if (!isYearValid(year)) year = detectedYear;
    return formatDate(year, parseInt(isoDate[2]), parseInt(isoDate[3]));
  }
  
  // Jan 1, 2024
  const mdyText = txt.match(/^([A-Za-z]{3,9})\s*(\d{1,2})[,\s]+(\d{2,4})$/i);
  if (mdyText) {
    const month = MONTH_MAP[mdyText[1].toLowerCase()];
    let year = parseInt(mdyText[3]);
    if (!month) return null;
    year = fixCentury(year);
    if (!isYearValid(year)) year = detectedYear;
    return formatDate(year, month, parseInt(mdyText[2]));
  }
  
  // Fallback
  try {
    const d = new Date(txt);
    if (!isNaN(d.getTime())) {
      let year = fixCentury(d.getFullYear());
      if (!isYearValid(year)) year = detectedYear;
      return formatDate(year, d.getMonth() + 1, d.getDate());
    }
  } catch (e) {}
  
  return null;
}

// =============================================
// API ENDPOINT: UPLOAD EXCEL
// =============================================
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const workbook = XLSX.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    
    console.log("\n" + "=".repeat(60));
    console.log("         EXCEL UPLOAD STARTED");
    console.log("=".repeat(60) + "\n");
    console.log(`Found ${sheetNames.length} sheet(s):`, sheetNames.join(", "));
    
    const dataSheets = sheetNames.filter(name => {
      const lower = name.toLowerCase();
      // Skip only specific summary/comparison sheets
      if (lower.startsWith("t_")) return false;
      if (lower.includes("summ")) return false;
      if (lower.includes("comp")) return false;
      if (lower === "sheet2" || lower === "sheet3") return false;
      if (lower.includes("&") && lower.includes("19")) return false; // "2018 & 2019" type
      // KEEP G sheets - they're valid data
      return true;
    });
    
    console.log(`Processing ${dataSheets.length} data sheet(s):`, dataSheets.join(", "));
    console.log(`Skipping ${sheetNames.length - dataSheets.length} summary/graph sheets\n`);
    
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM consumption", [], function(err) {
        if (err) reject(err);
        else {
          console.log(`✓ Cleared ${this.changes} old rows from database\n`);
          resolve();
        }
      });
    });
    
    let totalInserted = 0;
    let totalSkipped = 0;
    const yearsSummary = {};
    const insertedDates = new Set();
    
    for (let sheetIndex = 0; sheetIndex < dataSheets.length; sheetIndex++) {
      const sheetName = dataSheets[sheetIndex];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      
      if (!rows.length) {
        console.log(`Sheet "${sheetName}": Empty, skipping`);
        continue;
      }
      
      const detectedYear = detectYearFromSheet(rows, sheetName);
      
      console.log(`\n${"─".repeat(50)}`);
      console.log(`Sheet ${sheetIndex + 1}: "${sheetName}"`);
      console.log(`${"─".repeat(50)}`);
      console.log(`Rows: ${rows.length}, Detected Year: ${detectedYear}`);
      
      const columns = Object.keys(rows[0]);
      
      const dateCol = findColumn(columns, COLUMN_PATTERNS.date, false) || columns[0];
      const productionCol = findColumn(columns, COLUMN_PATTERNS.production, true);
      const electricityCol = findColumn(columns, COLUMN_PATTERNS.electricity, true);
      const cngCol = findColumn(columns, COLUMN_PATTERNS.cng, true);
      const waterCol = findColumn(columns, COLUMN_PATTERNS.water, true);
      const airCol = findColumn(columns, COLUMN_PATTERNS.air, true);
      
      // Find target columns
      const electricityTargetCol = findColumn(columns, COLUMN_PATTERNS.electricityTarget, false);
      const waterTargetCol = findColumn(columns, COLUMN_PATTERNS.waterTarget, false);
      const cngTargetCol = findColumn(columns, COLUMN_PATTERNS.cngTarget, false);
      const airTargetCol = findColumn(columns, COLUMN_PATTERNS.airTarget, false);
      
      console.log(`\n✓ Column Mapping:`);
      console.log(`  Date:        "${dateCol}"`);
      console.log(`  Production:  "${productionCol || '⚠️ NOT FOUND'}"`);
      console.log(`  Electricity: "${electricityCol || '⚠️ NOT FOUND'}"`);
      console.log(`  CNG:         "${cngCol || '⚠️ NOT FOUND'}"`);
      console.log(`  Water:       "${waterCol || '⚠️ NOT FOUND'}"`);
      console.log(`  Air:         "${airCol || '⚠️ NOT FOUND'}"`);
      if (electricityTargetCol) console.log(`  Electricity Target: "${electricityTargetCol}"`);
      if (waterTargetCol) console.log(`  Water Target: "${waterTargetCol}"`);
      if (cngTargetCol) console.log(`  CNG Target: "${cngTargetCol}"`);
      if (airTargetCol) console.log(`  Air Target: "${airTargetCol}"`);
      
      let sheetInserted = 0;
      let sheetSkipped = 0;
      
      const stmt = db.prepare(`
        INSERT INTO consumption ("date", production_count, electricity_kwh, cng_scm, water_m3, air_m3, 
                                electricity_target_per_car, water_target_per_car, cng_target_per_car, air_target_per_car)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const row of rows) {
        const parsedDate = parseDate(row[dateCol], detectedYear);
        if (!parsedDate) { sheetSkipped++; continue; }
        if (insertedDates.has(parsedDate)) { sheetSkipped++; continue; }
        
        // Clean values - allow 0 for missing production
        const production = cleanNumber(productionCol ? row[productionCol] : 0);
        const electricity = cleanNumber(electricityCol ? row[electricityCol] : 0);
        const cng = cleanNumber(cngCol ? row[cngCol] : 0);
        const water = cleanNumber(waterCol ? row[waterCol] : 0);
        const air = cleanNumber(airCol ? row[airCol] : 0);
        
        // Skip only if date is invalid or #DIV/0! errors
        if (typeof row[electricityCol] === 'string' && row[electricityCol].includes('DIV')) {
          sheetSkipped++;
          continue;
        }
        // Clean target values
        const electricityTarget = cleanNumber(electricityTargetCol ? row[electricityTargetCol] : 0);
        const waterTarget = cleanNumber(waterTargetCol ? row[waterTargetCol] : 0);
        const cngTarget = cleanNumber(cngTargetCol ? row[cngTargetCol] : 0);
        const airTarget = cleanNumber(airTargetCol ? row[airTargetCol] : 0);
        
        // Skip summary rows (production > 50000 is unrealistic)
        if (production > 50000) {
          sheetSkipped++;
          continue;
        }
        
        // INSERT the row even if production is 0
        stmt.run(parsedDate, production, electricity, cng, water, air, electricityTarget, waterTarget, cngTarget, airTarget);
        insertedDates.add(parsedDate);
        sheetInserted++;
      }
      
      stmt.finalize();
      
      totalInserted += sheetInserted;
      totalSkipped += sheetSkipped;
      
      if (!yearsSummary[detectedYear]) yearsSummary[detectedYear] = 0;
      yearsSummary[detectedYear] += sheetInserted;
      
      console.log(`✓ Inserted: ${sheetInserted}, Skipped: ${sheetSkipped}`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("         UPLOAD COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total Inserted: ${totalInserted} rows`);
    console.log(`Total Skipped: ${totalSkipped} rows`);
    console.log("By Year:", JSON.stringify(yearsSummary, null, 2));
    console.log("=".repeat(60) + "\n");
    
    res.json({
      message: "Excel imported successfully",
      sheetsProcessed: dataSheets.length,
      totalInserted,
      totalSkipped,
      byYear: yearsSummary
    });
    
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// API ENDPOINT: CLEAR ALL DATA
// =============================================
router.delete("/clear", (req, res) => {
  db.run("DELETE FROM consumption", [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`✓ Cleared ${this.changes} rows from database`);
    res.json({ message: "All data cleared", deleted: this.changes });
  });
});

module.exports = router;
