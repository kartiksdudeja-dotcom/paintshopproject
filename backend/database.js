const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("consumption.db");

// Create table with all columns including air_m3
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "date" TEXT,
      production_count INTEGER,
      electricity_kwh REAL,
      cng_scm REAL,
      water_m3 REAL,
      air_m3 REAL
    )
  `,
    (err) => {
      if (err) {
        console.error("Failed to ensure consumption table", err);
      }
    }
  );

  // Add air_m3 column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE consumption ADD COLUMN air_m3 REAL`, (err) => {
    // Ignore error if column already exists
  });

  // Add target columns for comparison (electricity_target_per_car, water_target_per_car, etc.)
  db.run(`ALTER TABLE consumption ADD COLUMN electricity_target_per_car REAL`, (err) => {
    // Ignore error if column already exists
  });
  db.run(`ALTER TABLE consumption ADD COLUMN water_target_per_car REAL`, (err) => {
    // Ignore error if column already exists
  });
  db.run(`ALTER TABLE consumption ADD COLUMN cng_target_per_car REAL`, (err) => {
    // Ignore error if column already exists
  });
  db.run(`ALTER TABLE consumption ADD COLUMN air_target_per_car REAL`, (err) => {
    // Ignore error if column already exists
  });
});

module.exports = db;
