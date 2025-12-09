const express = require("express");
const db = require("../database");
const router = express.Router();

// Convert incoming dates
function convertInputDate(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    let [m, dd, yyyy] = d.split("/");
    return `${yyyy}-${m}-${dd}`;
  }
  return null;
}

// =============================================
// GET /api/metrics/daily
// Returns daily data with actual, target, achieved %
// =============================================
router.get("/daily", (req, res) => {
  let { year, month, type } = req.query;
  // type = "electricity", "water", "cng", "air", "production"

  if (!year || !month || !type) {
    return res.status(400).json({ error: "Missing year, month, or type" });
  }

  year = parseInt(year);
  month = parseInt(month); // 0-indexed from frontend
  
  console.log(`📊 API Request - Year: ${year}, Month: ${month} (${month === 1 ? 'February' : month === 0 ? 'January' : 'Other'}), Type: ${type}`);
  
  const monthNum = String(month + 1).padStart(2, "0"); // Convert to 1-indexed for date string
  const fromDate = `${year}-${monthNum}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate(); // Correct month calculation
  const toDate = `${year}-${monthNum}-${String(lastDay).padStart(2, "0")}`;
  
  console.log(`📅 Date Range: ${fromDate} to ${toDate}`);

  const query = `
    SELECT "date" AS date, production_count,
           electricity_kwh, water_m3, cng_scm, air_m3,
           electricity_target_per_car, water_target_per_car, 
           cng_target_per_car, air_target_per_car
    FROM consumption
    WHERE "date" >= ? AND "date" <= ?
    ORDER BY "date" ASC
  `;

  db.all(query, [fromDate, toDate], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const columnMap = {
      electricity: { value: "electricity_kwh", target: "electricity_target_per_car", unit: "kWh" },
      water: { value: "water_m3", target: "water_target_per_car", unit: "m³" },
      cng: { value: "cng_scm", target: "cng_target_per_car", unit: "SCM" },
      air: { value: "air_m3", target: "air_target_per_car", unit: "m³" },
      production: { value: "production_count", target: null, unit: "Cars" },
    };

    const config = columnMap[type];
    if (!config) return res.status(400).json({ error: "Invalid type" });

    const dailyData = rows.map((r) => {
      const actual = r[config.value] || 0;
      const production = r.production_count || 0;
      const target = config.target ? r[config.target] || 0 : null;

      // Per-car actual
      const actualPerCar = production > 0 ? actual / production : 0;

      // Calculate achieved %
      let achievedPercent = 0;
      if (target && target > 0) {
        achievedPercent = Math.round((actualPerCar / target) * 100);
      }

      return {
        date: r.date,
        label: new Date(r.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        actual: Math.round(actual),
        actualPerCar: parseFloat(actualPerCar.toFixed(2)),
        target: target ? Math.round(target) : null,
        achievedPercent,
        production,
      };
    });

    // Calculate monthly totals
    const totalActual = dailyData.reduce((sum, d) => sum + d.actual, 0);
    const totalProduction = dailyData.reduce((sum, d) => sum + d.production, 0);
    const avgActualPerCar = totalProduction > 0 ? totalActual / totalProduction : 0;

    const avgTarget = dailyData.length > 0 
      ? dailyData.reduce((sum, d) => sum + (d.target || 0), 0) / dailyData.length 
      : 0;

    const monthlyAchieved = avgTarget > 0 
      ? Math.round((avgActualPerCar / avgTarget) * 100) 
      : 0;

    res.json({
      year,
      month: parseInt(month),
      type,
      unit: config.unit,
      daily: dailyData,
      monthly: {
        totalActual,
        totalProduction,
        avgPerCar: parseFloat(avgActualPerCar.toFixed(2)),
        avgTarget: Math.round(avgTarget),
        achievedPercent: monthlyAchieved,
      },
    });
  });
});

// =============================================
// GET /api/metrics/monthly
// Returns monthly totals for all months in a year
// =============================================
router.get("/monthly", (req, res) => {
  const { year, type } = req.query;
  // type = "electricity", "water", "cng", "air", "production"

  if (!year || !type) {
    return res.status(400).json({ error: "Missing year or type" });
  }

  const fromDate = `${year}-01-01`;
  const toDate = `${year}-12-31`;

  const query = `
    SELECT "date" AS date, production_count,
           electricity_kwh, water_m3, cng_scm, air_m3,
           electricity_target_per_car, water_target_per_car, 
           cng_target_per_car, air_target_per_car
    FROM consumption
    WHERE "date" >= ? AND "date" <= ?
    ORDER BY "date" ASC
  `;

  db.all(query, [fromDate, toDate], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const columnMap = {
      electricity: { value: "electricity_kwh", target: "electricity_target_per_car", unit: "kWh" },
      water: { value: "water_m3", target: "water_target_per_car", unit: "m³" },
      cng: { value: "cng_scm", target: "cng_target_per_car", unit: "SCM" },
      air: { value: "air_m3", target: "air_target_per_car", unit: "m³" },
      production: { value: "production_count", target: null, unit: "Cars" },
    };

    const config = columnMap[type];
    if (!config) return res.status(400).json({ error: "Invalid type" });

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTotals = {};

    // Initialize all months
    MONTH_NAMES.forEach((month, idx) => {
      monthlyTotals[idx] = {
        month: MONTH_NAMES[idx],
        totalActual: 0,
        totalProduction: 0,
        avgActualPerCar: 0,
        avgTarget: 0,
        achievedPercent: 0,
        daysCount: 0,
      };
    });

    // Aggregate by month
    rows.forEach((r) => {
      const dateObj = new Date(r.date);
      const monthIdx = dateObj.getMonth();
      const actual = r[config.value] || 0;
      const production = r.production_count || 0;
      const target = config.target ? r[config.target] || 0 : 0;

      monthlyTotals[monthIdx].totalActual += actual;
      monthlyTotals[monthIdx].totalProduction += production;
      monthlyTotals[monthIdx].avgTarget += target;
      monthlyTotals[monthIdx].daysCount++;
    });

    // Calculate per-car and achieved %
    const monthlyData = Object.values(monthlyTotals).map((m) => {
      const avgPerCar = m.totalProduction > 0 ? m.totalActual / m.totalProduction : 0;
      const avgTargetPerCar = m.daysCount > 0 ? m.avgTarget / m.daysCount : 0;
      const achievedPercent = avgTargetPerCar > 0 ? Math.round((avgPerCar / avgTargetPerCar) * 100) : 0;

      return {
        month: m.month,
        totalActual: Math.round(m.totalActual),
        totalProduction: m.totalProduction,
        avgPerCar: parseFloat(avgPerCar.toFixed(2)),
        avgTarget: Math.round(avgTargetPerCar),
        achievedPercent,
      };
    });

    res.json({
      year,
      type,
      unit: config.unit,
      monthly: monthlyData,
    });
  });
});

// =============================================
// GET /api/metrics/comparison
// Returns actual vs target comparison data
// =============================================
router.get("/comparison", (req, res) => {
  const { year, month, type } = req.query;

  if (!year || !month || !type) {
    return res.status(400).json({ error: "Missing year, month, or type" });
  }

  const monthNum = String(month).padStart(2, "0");
  const fromDate = `${year}-${monthNum}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${monthNum}-${lastDay}`;

  const query = `
    SELECT "date" AS date, production_count,
           electricity_kwh, water_m3, cng_scm, air_m3,
           electricity_target_per_car, water_target_per_car, 
           cng_target_per_car, air_target_per_car
    FROM consumption
    WHERE "date" >= ? AND "date" <= ?
    ORDER BY "date" ASC
  `;

  db.all(query, [fromDate, toDate], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const columnMap = {
      electricity: { value: "electricity_kwh", target: "electricity_target_per_car" },
      water: { value: "water_m3", target: "water_target_per_car" },
      cng: { value: "cng_scm", target: "cng_target_per_car" },
      air: { value: "air_m3", target: "air_target_per_car" },
      production: { value: "production_count", target: null },
    };

    const config = columnMap[type];
    if (!config) return res.status(400).json({ error: "Invalid type" });

    const comparisonData = rows.map((r) => {
      const actual = r[config.value] || 0;
      const production = r.production_count || 0;
      const target = config.target ? r[config.target] || 0 : null;

      const actualPerCar = production > 0 ? actual / production : 0;
      const achievedPercent = target && target > 0 ? Math.round((actualPerCar / target) * 100) : 0;

      return {
        date: r.date,
        actual: Math.round(actual),
        actualPerCar: parseFloat(actualPerCar.toFixed(2)),
        target: target ? Math.round(target) : null,
        achievedPercent,
        production,
      };
    });

    res.json({
      year,
      month: parseInt(month),
      type,
      data: comparisonData,
    });
  });
});

module.exports = router;
