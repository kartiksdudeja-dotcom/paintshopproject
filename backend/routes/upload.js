const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const db = require("../database");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Convert Excel serial date → YYYY-MM-DD
function excelToDate(serial) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  return date.toISOString().slice(0, 10);
}

// Clean numeric value
function cleanNumber(v) {
  if (v === null || v === undefined || v === "" || v === " ") return 0;
  if (typeof v === "string" && v.includes("DIV")) return 0;
  return Number(v) || 0;
}

// Parse date
function parseDate(raw) {
  if (!raw) return null;

  // Excel serial number
  if (typeof raw === "number") {
    return excelToDate(raw);
  }

  // Skip totals row (like "Jan-25")
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower === "jan-25" || lower.includes("total")) {
      return null;
    }
  }

  // Try parsing as date string
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

router.post("/", upload.single("file"), (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log("Total rows in Excel:", rows.length);
    console.log("Columns:", Object.keys(rows[0] || {}));

    let insertedCount = 0;

    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO consumption ("date", production_count, electricity_kwh, cng_scm, water_m3)
        VALUES (?, ?, ?, ?, ?)
      `);

      rows.forEach((row, index) => {
        const rawDate = row["Date"];
        const finalDate = parseDate(rawDate);

        // Skip invalid/total rows
        if (!finalDate) {
          console.log(`Skipping row ${index + 1}:`, rawDate);
          return;
        }

        const production = cleanNumber(row["Production Count"]);
        const electricity = cleanNumber(row["Electricity Consumption (KWH)"]);
        const cng = cleanNumber(row["CNG Consumption (SCM)"]);
        const water = cleanNumber(row["Water Consumption (m3)"]);

        console.log(`Inserting: ${finalDate} | Prod: ${production} | Elec: ${Math.round(electricity)} | CNG: ${Math.round(cng)} | Water: ${Math.round(water)}`);

        stmt.run(finalDate, production, electricity, cng, water);
        insertedCount++;
      });

      stmt.finalize(() => {
        console.log(`Successfully inserted ${insertedCount} rows`);
      });
    });

    res.json({ message: `Excel imported successfully. ${insertedCount} rows processed.` });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res.status(500).send("Failed to import file.");
  }
});

module.exports = router;
