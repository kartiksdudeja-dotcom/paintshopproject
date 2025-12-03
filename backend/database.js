const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("consumption.db");

// Correct table
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "date" TEXT,
      production_count INTEGER,
      electricity_kwh REAL,
      cng_scm REAL,
      water_m3 REAL
    )
  `,
    (err) => {
      if (err) {
        console.error("Failed to ensure consumption table", err);
      }
    }
  );
});

module.exports = db;
