const db = require("./database");

// SHOW TABLE STRUCTURE
db.all("PRAGMA table_info(consumption)", [], (err, rows) => {
  console.log("TABLE STRUCTURE:");
  console.log(rows);

  // SHOW FIRST 5 ROWS
  db.all("SELECT * FROM consumption LIMIT 5", [], (err2, data) => {
    console.log("FIRST ROWS:");
    console.log(data);

    process.exit();
  });
});
