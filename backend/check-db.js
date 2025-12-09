const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('consumption.db');

db.all("SELECT COUNT(*) as count, MIN(date) as minDate, MAX(date) as maxDate FROM consumption", (err, rows) => {
  console.log('📊 Overall data:', rows[0]);
  
  db.all("SELECT COUNT(*) as febCount FROM consumption WHERE date LIKE '2025-02%'", (err, rows2) => {
    console.log('📅 Feb 2025 records:', rows2[0].febCount);
    
    db.all("SELECT COUNT(*) as janCount FROM consumption WHERE date LIKE '2025-01%'", (err, rows3) => {
      console.log('📅 Jan 2025 records:', rows3[0].janCount);
      
      db.all("SELECT date FROM consumption WHERE date LIKE '2025-02%' LIMIT 3", (err, rows4) => {
        console.log('📋 Sample Feb dates:', rows4.map(r => r.date));
        process.exit(0);
      });
    });
  });
});
