import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  Divider,
  Chip,
  TextField,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import AirIcon from "@mui/icons-material/Air";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FactoryIcon from "@mui/icons-material/Factory";
import CalculateIcon from "@mui/icons-material/Calculate";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import UploadPage from "./UploadPage";
import Charts from "../components/Charts";
import LocationTable from "../components/LocationTable";
import MetricComparison from "../components/MetricComparison";
import axios from "axios";
import dayjs from "dayjs";

const BASE = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

const MONTHS = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const SIDEBAR_WIDTH = 280;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  
  // Data state
  const [summary, setSummary] = useState({ 
    electricity: 0, water: 0, cng: 0, air: 0, production: 0 
  });
  const [perCar, setPerCar] = useState({ 
    electricity: 0, water: 0, cng: 0, air: 0 
  });
  const [trendData, setTrendData] = useState({
    electricity: [], water: [], cng: [], air: [], production: [], labels: [],
  });
  const [locations, setLocations] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-car calculator
  const [carCount, setCarCount] = useState(1);

  // Tabs & Comparison
  const [activeMetricTab, setActiveMetricTab] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [comparisonView, setComparisonView] = useState("month"); // "month" or "date"

  // ==========================================
  // Fetch available years
  // ==========================================
  const fetchAvailableYears = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/consumption/date-range`);
      if (res.data.minDate && res.data.maxDate) {
        const minYear = new Date(res.data.minDate).getFullYear();
        const maxYear = new Date(res.data.maxDate).getFullYear();
        const years = [];
        for (let y = minYear; y <= maxYear; y++) years.push(y);
        setAvailableYears(years);
        if (!selectedYear && years.length > 0) {
          setSelectedYear(years[years.length - 1]);
        }
      }
    } catch (err) {
      console.error("fetchAvailableYears error:", err);
    }
  }, [selectedYear]);

  // ==========================================
  // Fetch consumption data
  // ==========================================
  const fetchConsumption = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);

    try {
      let fromDate, toDate;
      if (selectedMonth === "all") {
        fromDate = `${selectedYear}-01-01`;
        toDate = `${selectedYear}-12-31`;
      } else {
        const month = parseInt(selectedMonth) + 1;
        const lastDay = new Date(selectedYear, month, 0).getDate();
        fromDate = `${selectedYear}-${String(month).padStart(2, "0")}-01`;
        toDate = `${selectedYear}-${String(month).padStart(2, "0")}-${lastDay}`;
      }

      const res = await axios.get(`${BASE}/api/consumption`, {
        params: { from: fromDate, to: toDate },
      });

      const data = res.data || {};
      setSummary(data.summary || { electricity: 0, water: 0, cng: 0, air: 0, production: 0 });
      setPerCar(data.perCar || { electricity: 0, water: 0, cng: 0, air: 0 });
      setTrendData(data.trend || { electricity: [], water: [], cng: [], air: [], production: [], labels: [] });
      setLocations(data.locations || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("fetchConsumption error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchAvailableYears(); }, [fetchAvailableYears]);
  useEffect(() => { if (selectedYear) fetchConsumption(); }, [selectedYear, selectedMonth, fetchConsumption]);

  const handleRefresh = async () => {
    await fetchAvailableYears();
    await fetchConsumption();
  };

  const handleAfterUpload = async () => {
    setShowUpload(false);
    await fetchAvailableYears();
    await fetchConsumption();
  };

  const formatNumber = (num) => num.toLocaleString("en-IN");

  // ==========================================
  // Create monthly aggregated data
  // ==========================================
  const getMonthlyData = useCallback(() => {
    const monthlyTotals = {
      electricity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      water: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      cng: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      air: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      production: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    locations.forEach(loc => {
      if (!loc.label) return;
      const date = dayjs(loc.label, ["DD MMM", "D MMM", "DD-MMM", "D-MMM"]);
      if (date.isValid()) {
        const month = date.month();
        monthlyTotals.electricity[month] += loc.electricity || 0;
        monthlyTotals.water[month] += loc.water || 0;
        monthlyTotals.cng[month] += loc.cng || 0;
        monthlyTotals.air[month] += loc.air || 0;
        monthlyTotals.production[month] += loc.production || 0;
      }
    });

    return monthlyTotals;
  }, [locations]);

  // eslint-disable-next-line no-unused-vars
  const monthlyData = getMonthlyData();
  // eslint-disable-next-line no-unused-vars
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ==========================================
  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#1a2332" }}>
      {/* ============ SIDEBAR ============ */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          bgcolor: "#0d1521",
          color: "#fff",
          p: 2,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #2a3a4a",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#4fc3f7" }}>
            🏭 ŠKODA VW
          </Typography>
          <Typography variant="caption" sx={{ color: "#8899a6" }}>
            Paint Shop Energy Monitor
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: "#2a3a4a", mb: 2 }} />

        {/* Status */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#4caf50", mr: 1 }} />
            <Typography variant="body2" sx={{ color: "#4caf50" }}>SYSTEM ONLINE</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "#8899a6" }}>
            Data: 2012 - 2025
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: "#2a3a4a", mb: 2 }} />

        {/* Year Selector */}
        <Typography variant="overline" sx={{ color: "#8899a6", mb: 1 }}>Select Year</Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={selectedYear || ""}
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{
              bgcolor: "#1a2a3a", color: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3a4a5a" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#4fc3f7" },
              "& .MuiSvgIcon-root": { color: "#fff" },
            }}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>📅 {year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Month Selector */}
        <Typography variant="overline" sx={{ color: "#8899a6", mb: 1 }}>Select Month</Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{
              bgcolor: "#1a2a3a", color: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3a4a5a" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#4fc3f7" },
              "& .MuiSvgIcon-root": { color: "#fff" },
            }}
          >
            <MenuItem value="all">📊 All Months</MenuItem>
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider sx={{ bgcolor: "#2a3a4a", mb: 2 }} />

        {/* Per-Car Calculator */}
        <Typography variant="overline" sx={{ color: "#8899a6", mb: 1 }}>
          <CalculateIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
          Per-Car Calculator
        </Typography>
        <Paper sx={{ bgcolor: "#1a2a3a", p: 2, borderRadius: 2, mb: 2 }}>
          <TextField
            label="Number of Cars"
            type="number"
            size="small"
            value={carCount}
            onChange={(e) => setCarCount(Math.max(1, parseInt(e.target.value) || 1))}
            fullWidth
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": { bgcolor: "#0d1521", color: "#fff" },
              "& .MuiInputLabel-root": { color: "#8899a6" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3a4a5a" },
            }}
          />
          <Typography variant="caption" sx={{ color: "#8899a6", display: "block", mb: 1 }}>
            Per Car Average:
          </Typography>
          <Box sx={{ fontSize: 12 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <span style={{ color: "#ffeb3b" }}>⚡ Electricity:</span>
              <span style={{ color: "#fff" }}>{perCar.electricity.toFixed(2)} kWh</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <span style={{ color: "#2196f3" }}>💧 Water:</span>
              <span style={{ color: "#fff" }}>{perCar.water.toFixed(2)} m³</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <span style={{ color: "#ff9800" }}>🔥 CNG:</span>
              <span style={{ color: "#fff" }}>{perCar.cng.toFixed(2)} SCM</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#00bcd4" }}>💨 Air:</span>
              <span style={{ color: "#fff" }}>{perCar.air.toFixed(2)} m³</span>
            </Box>
          </Box>

          <Divider sx={{ bgcolor: "#3a4a5a", my: 1.5 }} />

          <Typography variant="caption" sx={{ color: "#4fc3f7", display: "block", mb: 1 }}>
            For {carCount} Car{carCount > 1 ? "s" : ""}:
          </Typography>
          <Box sx={{ fontSize: 12 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <span style={{ color: "#ffeb3b" }}>⚡ Electricity:</span>
              <span style={{ color: "#fff" }}>{formatNumber(Math.round(perCar.electricity * carCount))} kWh</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <span style={{ color: "#2196f3" }}>💧 Water:</span>
              <span style={{ color: "#fff" }}>{formatNumber(Math.round(perCar.water * carCount))} m³</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <span style={{ color: "#ff9800" }}>🔥 CNG:</span>
              <span style={{ color: "#fff" }}>{formatNumber(Math.round(perCar.cng * carCount))} SCM</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#00bcd4" }}>💨 Air:</span>
              <span style={{ color: "#fff" }}>{formatNumber(Math.round(perCar.air * carCount))} m³</span>
            </Box>
          </Box>
        </Paper>

        <Divider sx={{ bgcolor: "#2a3a4a", mb: 2 }} />

        {/* Current Selection */}
        <Paper sx={{ bgcolor: "#1a2a3a", p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
            📆 {selectedYear || "---"}
            {selectedMonth !== "all" && ` - ${MONTHS[selectedMonth]?.label}`}
          </Typography>
          {lastRefresh && (
            <Typography variant="caption" sx={{ color: "#8899a6" }}>
              Updated: {dayjs(lastRefresh).format("HH:mm:ss")}
            </Typography>
          )}
        </Paper>

        {/* Actions */}
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ mb: 1, bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}
        >
          Refresh Data
        </Button>

        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={() => setShowUpload(!showUpload)}
          sx={{ color: "#4fc3f7", borderColor: "#4fc3f7", "&:hover": { bgcolor: "rgba(79, 195, 247, 0.1)" } }}
        >
          Upload Excel
        </Button>

        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ color: "#5a6a7a", textAlign: "center", mt: 2 }}>
          © 2025 Internal Monitoring
        </Typography>
      </Box>

      {/* ============ MAIN CONTENT ============ */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {showUpload && (
          <Paper sx={{ mb: 3, p: 2, bgcolor: "#243447", borderRadius: 2 }}>
            <UploadPage onUpload={handleAfterUpload} />
          </Paper>
        )}

        {/* ============ STATS CARDS ============ */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Production Count */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Paper 
              onClick={() => navigate("/production")}
              sx={{ p: 2, borderRadius: 2, background: "linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)", border: "1px solid #2a4a6a", cursor: "pointer", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)", borderColor: "#9c27b0", boxShadow: "0 8px 24px rgba(156, 39, 176, 0.3)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <FactoryIcon sx={{ color: "#9c27b0", fontSize: 28, mr: 1 }} />
                <Typography variant="caption" sx={{ color: "#8899a6" }}>Production</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                {formatNumber(summary.production)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9c27b0" }}>Cars</Typography>
            </Paper>
          </Grid>

          {/* Electricity */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Paper 
              onClick={() => navigate("/electricity")}
              sx={{ p: 2, borderRadius: 2, background: "linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)", border: "1px solid #2a4a6a", cursor: "pointer", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)", borderColor: "#ffeb3b", boxShadow: "0 8px 24px rgba(255, 235, 59, 0.3)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <ElectricBoltIcon sx={{ color: "#ffeb3b", fontSize: 28, mr: 1 }} />
                <Typography variant="caption" sx={{ color: "#8899a6" }}>Electricity</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                {formatNumber(summary.electricity)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#ffeb3b" }}>kWh</Typography>
            </Paper>
          </Grid>

          {/* Water */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Paper 
              onClick={() => navigate("/water")}
              sx={{ p: 2, borderRadius: 2, background: "linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)", border: "1px solid #2a4a6a", cursor: "pointer", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)", borderColor: "#2196f3", boxShadow: "0 8px 24px rgba(33, 150, 243, 0.3)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WaterDropIcon sx={{ color: "#2196f3", fontSize: 28, mr: 1 }} />
                <Typography variant="caption" sx={{ color: "#8899a6" }}>Water</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                {formatNumber(summary.water)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#2196f3" }}>m³</Typography>
            </Paper>
          </Grid>

          {/* CNG */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Paper 
              onClick={() => navigate("/cng")}
              sx={{ p: 2, borderRadius: 2, background: "linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)", border: "1px solid #2a4a6a", cursor: "pointer", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)", borderColor: "#ff9800", boxShadow: "0 8px 24px rgba(255, 152, 0, 0.3)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <LocalGasStationIcon sx={{ color: "#ff9800", fontSize: 28, mr: 1 }} />
                <Typography variant="caption" sx={{ color: "#8899a6" }}>CNG</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                {formatNumber(summary.cng)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#ff9800" }}>SCM</Typography>
            </Paper>
          </Grid>

          {/* Air */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Paper 
              onClick={() => navigate("/air")}
              sx={{ p: 2, borderRadius: 2, background: "linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)", border: "1px solid #2a4a6a", cursor: "pointer", transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)", borderColor: "#00bcd4", boxShadow: "0 8px 24px rgba(0, 188, 212, 0.3)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AirIcon sx={{ color: "#00bcd4", fontSize: 28, mr: 1 }} />
                <Typography variant="caption" sx={{ color: "#8899a6" }}>Air</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                {formatNumber(summary.air)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#00bcd4" }}>m³</Typography>
            </Paper>
          </Grid>

          {/* Per Car Summary */}
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Paper sx={{ p: 2, borderRadius: 2, background: "linear-gradient(135deg, #2e1a3f 0%, #1a0d27 100%)", border: "1px solid #4a2a6a" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <DirectionsCarIcon sx={{ color: "#e91e63", fontSize: 28, mr: 1 }} />
                <Typography variant="caption" sx={{ color: "#8899a6" }}>Per Car</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "#ffeb3b" }}>
                ⚡ {perCar.electricity.toFixed(1)} kWh
              </Typography>
              <Typography variant="body2" sx={{ color: "#2196f3" }}>
                💧 {perCar.water.toFixed(1)} m³
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ============ CHARTS ============ */}
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#243447", border: "1px solid #3a4a5a", mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Consumption Trend
            </Typography>
            <Chip
              label={`${selectedYear}${selectedMonth !== "all" ? " - " + MONTHS[selectedMonth]?.label : ""}`}
              size="small"
              sx={{ bgcolor: "#3a5a7a", color: "#fff" }}
            />
          </Box>
          <Charts data={trendData} />
        </Paper>

        {/* ============ DETAILED COMPARISON TABS ============ */}
        <Paper sx={{ borderRadius: 3, bgcolor: "#243447", border: "1px solid #3a4a5a", mb: 3 }}>
          {/* Metric Tabs */}
          <Box sx={{ borderBottom: "2px solid #3a4a5a", bgcolor: "#1a2a3a" }}>
            <Tabs
              value={activeMetricTab}
              onChange={(e, newValue) => setActiveMetricTab(newValue)}
              sx={{
                "& .MuiTab-root": { color: "#8899a6", "&.Mui-selected": { color: "#fff" } },
                "& .MuiTabs-indicator": { backgroundColor: "#4fc3f7" }
              }}
            >
              <Tab icon={<FactoryIcon />} label="Production" />
              <Tab icon={<ElectricBoltIcon />} label="Electricity" />
              <Tab icon={<WaterDropIcon />} label="Water" />
              <Tab icon={<LocalGasStationIcon />} label="CNG" />
              <Tab icon={<AirIcon />} label="Air" />
            </Tabs>
          </Box>

          {/* MetricComparison Component */}
          <MetricComparison
            metric={["production", "electricity", "water", "cng", "air"][activeMetricTab]}
            locations={locations}
            viewMode={comparisonView}
          />
        </Paper>

        {/* ============ DATA TABLE ============ */}
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#243447", border: "1px solid #3a4a5a" }}>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600, mb: 2 }}>
            📋 Detailed Data
          </Typography>
          <LocationTable locations={locations} />
        </Paper>
      </Box>
    </Box>
  );
}
