const express = require("express");
const db = require("../database");
const router = express.Router();

// Check if year is in valid range (2012-2030)
function isYearAllowed(dateStr) {
  if (!dateStr) return false;
  const y = parseInt(dateStr.substring(0, 4));
  return y >= 2012 && y <= 2030;
}

// Convert incoming dates to yyyy-mm-dd
function convertInputDate(d) {
  if (!d) return null;

  // Already yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }

  // mm/dd/yyyy (browser default)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    let [m, dd, yyyy] = d.split("/");
    return `${yyyy}-${m}-${dd}`;
  }

  // dd/mm/yyyy (rare case)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
    let [dd, m, yyyy] = d.split("/");
    return `${yyyy}-${m}-${dd}`;
  }

  return null;
}

router.get("/", (req, res) => {
  let { from, to } = req.query;

  // Convert incoming dates to yyyy-mm-dd
  from = convertInputDate(from);
  to = convertInputDate(to);

  if (!from || !to) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  const query = `
    SELECT "date" AS date, production_count, electricity_kwh, cng_scm, water_m3, air_m3,
           electricity_target_per_car, water_target_per_car, cng_target_per_car, air_target_per_car
    FROM consumption
    WHERE "date" >= ? AND "date" <= ?
    ORDER BY "date" ASC
  `;

  db.all(query, [from, to], (err, rows) => {
    if (err) return res.status(500).send(err);

    // Keep only rows with allowed years
    rows = rows.filter(r => isYearAllowed(r.date));

    if (!rows.length) {
      return res.json({
        summary: { electricity: 0, water: 0, cng: 0, production: 0, air: 0 },
        perCar: { electricity: 0, water: 0, cng: 0, air: 0 },
        trend: { labels: [], electricity: [], water: [], cng: [], air: [] },
        locations: [],
      });
    }

    // -------------------------
    // SUMMARY (Totals)
    // -------------------------
    const totalElectricity = rows.reduce((s, r) => s + (r.electricity_kwh || 0), 0);
    const totalWater = rows.reduce((s, r) => s + (r.water_m3 || 0), 0);
    const totalCng = rows.reduce((s, r) => s + (r.cng_scm || 0), 0);
    const totalAir = rows.reduce((s, r) => s + (r.air_m3 || 0), 0);
    const totalProduction = rows.reduce((s, r) => s + (r.production_count || 0), 0);

    const summary = {
      electricity: Math.round(totalElectricity),
      water: Math.round(totalWater),
      cng: Math.round(totalCng),
      air: Math.round(totalAir),
      production: Math.round(totalProduction),
    };

    // -------------------------
    // PER CAR CALCULATION (Only from rows where production > 0)
    // -------------------------
    // Filter rows where production > 0 for accurate per-car calculation
    const rowsWithProduction = rows.filter(r => (r.production_count || 0) > 0);
    
    let perCar = {
      electricity: 0,
      water: 0,
      cng: 0,
      air: 0,
    };
    
    if (rowsWithProduction.length > 0) {
      const prodElectricity = rowsWithProduction.reduce((s, r) => s + (r.electricity_kwh || 0), 0);
      const prodWater = rowsWithProduction.reduce((s, r) => s + (r.water_m3 || 0), 0);
      const prodCng = rowsWithProduction.reduce((s, r) => s + (r.cng_scm || 0), 0);
      const prodAir = rowsWithProduction.reduce((s, r) => s + (r.air_m3 || 0), 0);
      const prodCount = rowsWithProduction.reduce((s, r) => s + (r.production_count || 0), 0);
      
      if (prodCount > 0) {
        perCar = {
          electricity: parseFloat((prodElectricity / prodCount).toFixed(2)),
          water: parseFloat((prodWater / prodCount).toFixed(2)),
          cng: parseFloat((prodCng / prodCount).toFixed(2)),
          air: parseFloat((prodAir / prodCount).toFixed(2)),
        };
      }
    }

    // -------------------------
    // TREND CHART (Monthly)
    // -------------------------
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthly = {};

    rows.forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      if (!monthly[key]) {
        monthly[key] = {
          label,
          electricity: 0,
          water: 0,
          cng: 0,
          air: 0,
          production: 0,
        };
      }

      monthly[key].electricity += r.electricity_kwh || 0;
      monthly[key].water += r.water_m3 || 0;
      monthly[key].cng += r.cng_scm || 0;
      monthly[key].air += r.air_m3 || 0;
      monthly[key].production += r.production_count || 0;
    });

    const monthArr = Object.values(monthly);

    const trend = {
      labels: monthArr.map(m => m.label),
      electricity: monthArr.map(m => Math.round(m.electricity)),
      water: monthArr.map(m => Math.round(m.water)),
      cng: monthArr.map(m => Math.round(m.cng)),
      air: monthArr.map(m => Math.round(m.air)),
      production: monthArr.map(m => Math.round(m.production)),
    };

    // -------------------------
    // LOCATIONS (Daily or Monthly)
    // -------------------------
    const daysDiff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

    let locations = [];

    if (daysDiff > 31) {
      // Monthly view
      locations = monthArr.map(m => ({
        label: m.label,
        production: Math.round(m.production),
        electricity: Math.round(m.electricity),
        water: Math.round(m.water),
        cng: Math.round(m.cng),
        air: Math.round(m.air),
        electricityPerCar: m.production > 0 ? Math.round(m.electricity / m.production) : 0,
        waterPerCar: m.production > 0 ? Math.round(m.water / m.production) : 0,
        cngPerCar: m.production > 0 ? Math.round(m.cng / m.production) : 0,
        airPerCar: m.production > 0 ? Math.round(m.air / m.production) : 0,
      }));
    } else {
      // Daily view
      locations = rows.map(r => {
        const label = new Date(r.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
        
        const actualPerCar = {
          electricity: r.production_count > 0 ? r.electricity_kwh / r.production_count : 0,
          water: r.production_count > 0 ? r.water_m3 / r.production_count : 0,
          cng: r.production_count > 0 ? r.cng_scm / r.production_count : 0,
          air: r.production_count > 0 ? r.air_m3 / r.production_count : 0,
        };

        return {
          label,
          production: Math.round(r.production_count || 0),
          electricity: Math.round(r.electricity_kwh || 0),
          water: Math.round(r.water_m3 || 0),
          cng: Math.round(r.cng_scm || 0),
          air: Math.round(r.air_m3 || 0),
          // Target values
          electricityTargetPerCar: r.electricity_target_per_car || 0,
          waterTargetPerCar: r.water_target_per_car || 0,
          cngTargetPerCar: r.cng_target_per_car || 0,
          airTargetPerCar: r.air_target_per_car || 0,
          // Actual per-car values
          electricityActualPerCar: parseFloat(actualPerCar.electricity.toFixed(2)),
          waterActualPerCar: parseFloat(actualPerCar.water.toFixed(2)),
          cngActualPerCar: parseFloat(actualPerCar.cng.toFixed(2)),
          airActualPerCar: parseFloat(actualPerCar.air.toFixed(2)),
        };
      });
    }

    return res.json({ summary, perCar, trend, locations });
  });
});

// DATE RANGE API
router.get("/date-range", (req, res) => {
  const query = `
    SELECT MIN("date") AS minDate, MAX("date") AS maxDate
    FROM consumption
  `;

  db.get(query, [], (err, row) => {
    if (err) return res.status(500).send(err);

    return res.json({
      minDate: row?.minDate || null,
      maxDate: row?.maxDate || null,
    });
  });
});

module.exports = router;
