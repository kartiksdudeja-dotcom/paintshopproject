const db = require('./database');

console.log('\n=== CHECKING 2024 DATA ===\n');

// Check total 2024 rows
db.all(`
  SELECT 
    date, 
    production_count, 
    electricity_kwh, 
    water_m3, 
    cng_scm, 
    air_m3
  FROM consumption 
  WHERE date LIKE '2024-%'
  ORDER BY date
  LIMIT 25
`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log(`Found ${rows.length} rows for 2024\n`);
  
  if (rows.length === 0) {
    console.log('❌ NO DATA FOR 2024!');
    process.exit(0);
  }
  
  console.log('Sample 2024 rows:');
  console.log('─'.repeat(120));
  console.table(rows);
  
  // Check statistics
  const totalProduction = rows.reduce((sum, r) => sum + (r.production_count || 0), 0);
  const totalElectricity = rows.reduce((sum, r) => sum + (r.electricity_kwh || 0), 0);
  const totalAir = rows.reduce((sum, r) => sum + (r.air_m3 || 0), 0);
  const rowsWithProduction = rows.filter(r => r.production_count > 0).length;
  
  console.log('\n=== 2024 STATISTICS ===');
  console.log(`Total rows: ${rows.length}`);
  console.log(`Rows with production > 0: ${rowsWithProduction}`);
  console.log(`Total production: ${totalProduction}`);
  console.log(`Total electricity: ${totalElectricity}`);
  console.log(`Total air: ${totalAir}`);
  
  process.exit(0);
});
