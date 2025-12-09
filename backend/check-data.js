const db = require('./database');

console.log("=== Checking Database Data ===\n");

// Check all years and what data they have
db.all(`SELECT 
  substr(date, 1, 4) as year, 
  COUNT(*) as rows,
  SUM(production_count) as total_prod,
  SUM(electricity_kwh) as total_elec,
  SUM(air_m3) as total_air
FROM consumption 
GROUP BY year 
ORDER BY year`, [], (err, rows) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("DATA BY YEAR:");
    console.log("Year | Rows | Production | Electricity | Air");
    console.log("-----|------|------------|-------------|----");
    rows.forEach(r => {
      console.log(`${r.year} | ${r.rows.toString().padStart(4)} | ${(r.total_prod || 0).toString().padStart(10)} | ${Math.round(r.total_elec || 0).toString().padStart(11)} | ${Math.round(r.total_air || 0)}`);
    });
  }
  
  // Check sample 2024 data with all columns
  db.all(`SELECT date, production_count, electricity_kwh, water_m3, cng_scm, air_m3 FROM consumption WHERE date LIKE '2024-01%' ORDER BY date LIMIT 10`, [], (err2, rows2) => {
    if (err2) {
      console.error("Error:", err2);
    } else {
      console.log("\n\n2024 JANUARY SAMPLE (first 10 rows):");
      console.log("Date       | Prod | Elec    | Water | CNG   | Air");
      console.log("-----------|------|---------|-------|-------|------");
      rows2.forEach(r => {
        console.log(`${r.date} | ${(r.production_count || 0).toString().padStart(4)} | ${Math.round(r.electricity_kwh || 0).toString().padStart(7)} | ${Math.round(r.water_m3 || 0).toString().padStart(5)} | ${Math.round(r.cng_scm || 0).toString().padStart(5)} | ${Math.round(r.air_m3 || 0)}`);
      });
      console.log(`\nTotal 2024-01 rows: ${rows2.length}`);
    }
    
    db.close();
  });
});
