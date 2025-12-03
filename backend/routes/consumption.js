const express = require("express");
const db = require("../database");
const router = express.Router();

// Convert any date format to yyyy-mm-dd
function convertInputDate(d) {
  if (!d) return null;
  
  // Already in YYYY-MM-DD format
  if (d.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return d;
  }
  
  // Convert dd/mm/yyyy to yyyy-mm-dd
  if (d.includes("/")) {
    const [day, month, year] = d.split("/");
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

router.get("/", (req, res) => {
  let { from, to } = req.query;

  // Convert incoming dates
  from = convertInputDate(from);
  to = convertInputDate(to);

  if (!from || !to) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  const query = `
    SELECT "date" AS date, production_count, electricity_kwh, cng_scm, water_m3
    FROM consumption
    WHERE "date" >= ? AND "date" <= ?
    ORDER BY "date" ASC
  `;

  db.all(query, [from, to], (err, rows) => {
    if (err) return res.status(500).send(err);

    if (!rows.length) {
      return res.json({
        summary: { electricity: 0, water: 0, cng: 0 },
        trend: { labels: [], electricity: [], water: [], cng: [] },
        locations: [],
      });
    }

    // -------------------------
    // SUMMARY = FIRST DATE values, not totals
    // -------------------------
    const first = rows[0];

    const summary = {
      electricity: first.electricity_kwh || 0,
      water: first.water_m3 || 0,
      cng: first.cng_scm || 0,
    };

    // -------------------------
    // TREND CHART
    // -------------------------
    const trend = {
      labels: rows.map(r => r.date),
      electricity: rows.map(r => r.electricity_kwh || 0),
      water: rows.map(r => r.water_m3 || 0),
      cng: rows.map(r => r.cng_scm || 0),
    };

    // -------------------------
    // LOCATIONS (DAY-WISE DATA)
    // -------------------------
    const locations = rows.map((r) => {
      const prod = r.production_count || 0;

      const elec = r.electricity_kwh || 0;
      const cng = r.cng_scm || 0;
      const water = r.water_m3 || 0;

      return {
        date: r.date,
        production: prod,

        electricity: elec,
        electricity_per_car: prod > 0 ? (elec / prod).toFixed(2) : 0,

        cng: cng,
        cng_per_car: prod > 0 ? (cng / prod).toFixed(2) : 0,

        water: water,
        water_per_car: prod > 0 ? (water / prod).toFixed(2) : 0,
      };
    });

    return res.json({ summary, trend, locations });
  });
});

module.exports = router;
