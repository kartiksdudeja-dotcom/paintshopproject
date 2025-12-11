import React, { useMemo } from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import { Bar, Line } from "react-chartjs-2";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MetricComparison = ({ metric, locations = [], viewMode = "month" }) => {
  const metricConfig = {
    electricity: {
      label: "Electricity (kWh)",
      color: "#ffeb3b",
      dataKey: "electricity",
      perCarKey: "electricityPerCar",
      targetKey: "electricityTargetPerCar",
      actualKey: "electricityActualPerCar",
      unit: "kWh",
      perCarUnit: "kWh/Car",
    },
    water: {
      label: "Water (m³)",
      color: "#2196f3",
      dataKey: "water",
      perCarKey: "waterPerCar",
      targetKey: "waterTargetPerCar",
      actualKey: "waterActualPerCar",
      unit: "m³",
      perCarUnit: "m³/Car",
    },
    cng: {
      label: "CNG (SCM)",
      color: "#ff9800",
      dataKey: "cng",
      perCarKey: "cngPerCar",
      targetKey: "cngTargetPerCar",
      actualKey: "cngActualPerCar",
      unit: "SCM",
      perCarUnit: "SCM/Car",
    },
    air: {
      label: "Air (m³)",
      color: "#00bcd4",
      dataKey: "air",
      perCarKey: "airPerCar",
      targetKey: "airTargetPerCar",
      actualKey: "airActualPerCar",
      unit: "m³",
      perCarUnit: "m³/Car",
    },
    production: {
      label: "Production (Cars)",
      color: "#4caf50",
      dataKey: "production",
      perCarKey: null,
      targetKey: null,
      actualKey: null,
      unit: "Cars",
      perCarUnit: "Cars",
    },
  };

  const config = metricConfig[metric];

  // Aggregate data by month
  const monthlyData = useMemo(() => {
    const monthTotals = {
      labels: MONTH_NAMES,
      total: Array(12).fill(0),
      perCar: Array(12).fill(0),
      target: Array(12).fill(0),
      production: Array(12).fill(0),
      count: Array(12).fill(0),
    };

    locations.forEach((loc) => {
      if (!loc.label) return;
      const parts = loc.label.split(" ");
      const monthIdx = MONTH_NAMES.findIndex((m) => m === parts[0]);
      if (monthIdx === -1) return;

      const value = loc[config.dataKey] || 0;
      const prod = loc.production || 1;

      monthTotals.total[monthIdx] += value;
      monthTotals.production[monthIdx] += prod;
      monthTotals.count[monthIdx]++;

      if (loc[config.perCarKey] !== undefined) {
        monthTotals.perCar[monthIdx] += loc[config.perCarKey];
      }
      if (loc[config.targetKey] && loc[config.targetKey] > 0) {
        monthTotals.target[monthIdx] += loc[config.targetKey];
      }
    });

    // Average per-car values
    monthTotals.perCar = monthTotals.perCar.map((val, i) =>
      monthTotals.count[i] > 0 ? Math.round((val / monthTotals.count[i]) * 100) / 100 : 0
    );

    // Average target values
    monthTotals.target = monthTotals.target.map((val, i) =>
      monthTotals.count[i] > 0 ? Math.round((val / monthTotals.count[i]) * 100) / 100 : 0
    );

    // Round total values
    monthTotals.total = monthTotals.total.map((val) => Math.round(val));

    return monthTotals;
  }, [locations, config.dataKey, config.perCarKey, config.targetKey]);

  // Daily data for line chart
  const dailyChartData = useMemo(() => {
    return {
      labels: locations.map((l) => l.label || ""),
      datasets: [
        {
          label: `${config.label} - Actual`,
          data: locations.map((l) => l[config.dataKey] || 0),
          borderColor: config.color,
          backgroundColor: `${config.color}40`,
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [locations, config]);

  // Monthly total chart
  const monthlyTotalChart = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: `${config.label} - Total`,
        data: monthlyData.total,
        backgroundColor: config.color,
        borderColor: "#243447",
        borderWidth: 1,
      },
    ],
  };

  // Target vs Actual Per-Car chart
  const targetVsActualChart = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: "Target",
        data: monthlyData.target,
        backgroundColor: "#ff6b6b",
        borderColor: "#ff6b6b",
        borderWidth: 2,
      },
      {
        label: "Actual",
        data: monthlyData.perCar,
        backgroundColor: config.color,
        borderColor: config.color,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: "#fff" } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return typeof val === "number" ? val.toLocaleString("en-IN") : val;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "#8899a6" }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: {
        ticks: {
          color: "#8899a6",
          callback: (value) => (typeof value === "number" ? value.toLocaleString("en-IN") : value),
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#1a2a3a", borderRadius: 2 }}>
      {/* Monthly Total Chart */}
      <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: "#fff", mb: 2 }}>
          📊 {config.label} - Monthly Totals
        </Typography>
        <Box sx={{ height: 250 }}>
          <Bar data={monthlyTotalChart} options={chartOptions} />
        </Box>
      </Paper>

      {/* Daily Trend Chart */}
      <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: "#fff", mb: 2 }}>
          📈 {config.label} - Daily Trend
        </Typography>
        <Box sx={{ height: 250 }}>
          <Line data={dailyChartData} options={chartOptions} />
        </Box>
      </Paper>

      {/* Target vs Actual (Per-Car) */}
      {config.targetKey && (
        <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: "#fff", mb: 2 }}>
            🎯 {config.perCarUnit} - Target vs Actual
          </Typography>
          <Box sx={{ height: 250 }}>
            <Bar data={targetVsActualChart} options={chartOptions} />
          </Box>
        </Paper>
      )}

      {/* Statistics Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: "#8899a6" }}>
              Highest Month
            </Typography>
            <Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>
              {MONTH_NAMES[monthlyData.total.indexOf(Math.max(...monthlyData.total))]}
            </Typography>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              {Math.max(...monthlyData.total).toLocaleString("en-IN")} {config.unit}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: "#8899a6" }}>
              Average Monthly
            </Typography>
            <Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>
              {Math.round(monthlyData.total.reduce((a, b) => a + b, 0) / monthlyData.total.length)}
            </Typography>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              {config.unit}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: "#8899a6" }}>
              Total Year
            </Typography>
            <Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>
              {monthlyData.total.reduce((a, b) => a + b, 0).toLocaleString("en-IN")}
            </Typography>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              {config.unit}
            </Typography>
          </Paper>
        </Grid>

        {config.targetKey && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Avg Per-Car vs Target
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color:
                    monthlyData.perCar.reduce((a, b) => a + b, 0) / 12 <=
                    monthlyData.target.reduce((a, b) => a + b, 0) / 12
                      ? "#4caf50"
                      : "#ff6b6b",
                  fontWeight: 700,
                }}
              >
                {(
                  (monthlyData.perCar.reduce((a, b) => a + b, 0) / 12 /
                    (monthlyData.target.reduce((a, b) => a + b, 0) / 12 || 1)) *
                  100
                ).toFixed(1)}
                %
              </Typography>
              <Typography variant="body2" sx={{ color: "#fff" }}>
                of target
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MetricComparison;
