const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('consumption.db');

// Query Feb data directly
db.all("SELECT date FROM consumption WHERE date >= '2025-02-01' AND date <= '2025-02-28' ORDER BY date ASC LIMIT 5", (err, rows) => {
  console.log('🔍 Direct query for Feb 2025:');
  rows.forEach(r => console.log('  ', r.date));
  
  // Also test what the backend would calculate
  const year = 2025;
  const month = 1; // February (0-indexed)
  const monthNum = String(month + 1).padStart(2, "0");
  const fromDate = `${year}-${monthNum}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const toDate = `${year}-${monthNum}-${String(lastDay).padStart(2, "0")}`;
  
  console.log('\n📅 Backend calculation:');
  console.log('  fromDate:', fromDate);
  console.log('  toDate:', toDate);
  console.log('  lastDay:', lastDay);
  
  // Now query with backend's calculated dates
  db.all(`SELECT date FROM consumption WHERE date >= ? AND date <= ? ORDER BY date ASC LIMIT 5`, [fromDate, toDate], (err, rows2) => {
    console.log('\n🔍 Query with backend range:');
    rows2.forEach(r => console.log('  ', r.date));
    process.exit(0);
  });
});
