import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import { Line, Doughnut } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";

// REGISTER ALL REQUIRED CHART.JS MODULES
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

// Dark theme chart options
const createChartOptions = (title, color) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: title,
      color: color,
      font: { size: 14, weight: "bold" }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return context.parsed.y.toLocaleString("en-IN");
        }
      }
    }
  },
  scales: {
    x: {
      ticks: { color: "#8899a6", maxRotation: 45 },
      grid: { color: "rgba(255,255,255,0.05)" }
    },
    y: {
      ticks: { 
        color: "#8899a6",
        callback: (value) => value.toLocaleString("en-IN")
      },
      grid: { color: "rgba(255,255,255,0.05)" }
    }
  }
});

export default function Charts({ type = "line", data }) {
  const labels = data.labels || [];
  const electricity = data.electricity || [];
  const water = data.water || [];
  const cng = data.cng || [];
  const production = data.production || [];
  const air = data.air || [];

  // Check if we have data
  if (!labels.length) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ color: "#8899a6" }}>No chart data available</Typography>
      </Box>
    );
  }

  // ------------------ ELECTRICITY CHART ------------------
  const electricityData = {
    labels,
    datasets: [{
      label: "Electricity (kWh)",
      data: electricity,
      fill: true,
      tension: 0.4,
      borderColor: "#ffeb3b",
      backgroundColor: "rgba(255, 235, 59, 0.2)",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#ffeb3b",
      pointHoverRadius: 6,
    }]
  };

  // ------------------ WATER CHART ------------------
  const waterData = {
    labels,
    datasets: [{
      label: "Water (m³)",
      data: water,
      fill: true,
      tension: 0.4,
      borderColor: "#2196f3",
      backgroundColor: "rgba(33, 150, 243, 0.2)",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#2196f3",
      pointHoverRadius: 6,
    }]
  };

  // ------------------ CNG CHART ------------------
  const cngData = {
    labels,
    datasets: [{
      label: "CNG (SCM)",
      data: cng,
      fill: true,
      tension: 0.4,
      borderColor: "#ff9800",
      backgroundColor: "rgba(255, 152, 0, 0.2)",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#ff9800",
      pointHoverRadius: 6,
    }]
  };

  // ------------------ PRODUCTION CHART ------------------
  const productionData = {
    labels,
    datasets: [{
      label: "Production (Cars)",
      data: production,
      fill: true,
      tension: 0.4,
      borderColor: "#4caf50",
      backgroundColor: "rgba(76, 175, 80, 0.2)",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#4caf50",
      pointHoverRadius: 6,
    }]
  };

  // ------------------ AIR CHART ------------------
  const airData = {
    labels,
    datasets: [{
      label: "Air (m³)",
      data: air,
      fill: true,
      tension: 0.4,
      borderColor: "#9c27b0",
      backgroundColor: "rgba(156, 39, 176, 0.2)",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#9c27b0",
      pointHoverRadius: 6,
    }]
  };

  // ------------------ DOUGHNUT GRAPH ------------------
  const donutData = {
    labels: ["Electricity", "Water", "CNG"],
    datasets: [{
      data: [
        electricity.reduce((a, b) => a + (b || 0), 0),
        water.reduce((a, b) => a + (b || 0), 0),
        cng.reduce((a, b) => a + (b || 0), 0)
      ],
      backgroundColor: ["#ffeb3b", "#2196f3", "#ff9800"],
      borderColor: "#243447",
      borderWidth: 2,
    }]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#8899a6", padding: 15 }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed.toLocaleString("en-IN")}`;
          }
        }
      }
    }
  };

  return (
    <Box>
      {/* Individual Charts Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Production Chart */}
        <Grid item xs={12}>
          <Box sx={{ height: 180, bgcolor: "#1a2a3a", p: 2, borderRadius: 2 }}>
            <Line data={productionData} options={createChartOptions("🚗 Production (Cars)", "#4caf50")} />
          </Box>
        </Grid>

        {/* Electricity Chart */}
        <Grid item xs={12}>
          <Box sx={{ height: 200, bgcolor: "#1a2a3a", p: 2, borderRadius: 2 }}>
            <Line data={electricityData} options={createChartOptions("⚡ Electricity (kWh)", "#ffeb3b")} />
          </Box>
        </Grid>

        {/* Water & CNG side by side */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 180, bgcolor: "#1a2a3a", p: 2, borderRadius: 2 }}>
            <Line data={waterData} options={createChartOptions("💧 Water (m³)", "#2196f3")} />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ height: 180, bgcolor: "#1a2a3a", p: 2, borderRadius: 2 }}>
            <Line data={cngData} options={createChartOptions("🔥 CNG (SCM)", "#ff9800")} />
          </Box>
        </Grid>

        {/* Air Chart */}
        <Grid item xs={12}>
          <Box sx={{ height: 180, bgcolor: "#1a2a3a", p: 2, borderRadius: 2 }}>
            <Line data={airData} options={createChartOptions("💨 Air (m³)", "#9c27b0")} />
          </Box>
        </Grid>
      </Grid>

      {/* Doughnut Chart */}
      <Typography variant="subtitle2" sx={{ color: "#8899a6", mb: 1 }}>
        Total Share
      </Typography>
      <Box sx={{ height: 200 }}>
        <Doughnut data={donutData} options={donutOptions} />
      </Box>
    </Box>
  );
}
