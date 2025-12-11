import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import axios from "axios";

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
const MetricPage = ({ metricType, metricLabel, icon: Icon, color }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState("daily"); // "daily", "monthly"
  const [dataFilter, setDataFilter] = useState("all"); // "all", "npd" (no production days)
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);

  // Debug: Log when month changes
  useEffect(() => {
    console.log(`⚙️ Month changed to: ${month} (${MONTHS[month]?.label})`);
  }, [month]);

  // Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(`${BASE}/api/consumption/date-range`);
        if (res.data.minDate && res.data.maxDate) {
          const minYear = new Date(res.data.minDate).getFullYear();
          const maxYear = new Date(res.data.maxDate).getFullYear();
          const years = [];
          for (let y = minYear; y <= maxYear; y++) years.push(y);
          setAvailableYears(years);
        }
      } catch (err) {
        console.error("Error fetching years:", err);
      }
    };
    fetchYears();
  }, []);

  // Fetch data based on view mode
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (viewMode === "daily") {
          console.log(`🔄 Fetching daily data - Year: ${year}, Month: ${month}, Type: ${metricType}`);
          const res = await axios.get(`${BASE}/api/metrics/daily`, {
            params: { year, month, type: metricType },
          });
          console.log(`✅ Received ${res.data.daily?.length} daily records`, res.data);
          setDailyData(res.data);
        } else {
          const res = await axios.get(`${BASE}/api/metrics/monthly`, {
            params: { year, type: metricType },
          });
          setMonthlyData(res.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month, viewMode, metricType]);

  // Filter NPD (No Production Days)
  const filterNPDDays = useCallback((data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter((d) => !d.production || d.production === 0);
  }, []);

  // Create daily histogram data with consumption only
  const dailyHistogramData = useCallback(() => {
    if (!dailyData) return null;
    
    // Use filtered data if NPD view is active
    const dataToDisplay = dataFilter === "npd" ? filterNPDDays(dailyData.daily) : dailyData.daily;
    
    return {
      labels: dataToDisplay.map((d) => d.label),
      datasets: [
        {
          label: "Consumption",
          data: dataToDisplay.map((d) => d.actual),
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [dailyData, color, dataFilter, filterNPDDays]);


  // Create monthly bar data with color coding
  const monthlyBarData = useCallback(() => {
    if (!monthlyData) return null;
    
    // Color bars based on achievement
    const barColors = monthlyData.monthly.map((m) => {
      if (!m.avgTarget) return color;
      return m.avgPerCar <= m.avgTarget ? "#4caf50" : "#ff6b6b";
    });
    
    return {
      labels: monthlyData.monthly.map((m) => m.month),
      datasets: [
        {
          label: "Actual (Per Car)",
          data: monthlyData.monthly.map((m) => m.avgPerCar),
          backgroundColor: barColors,
          borderColor: barColors,
          borderWidth: 1,
          borderRadius: 4,
        },
        ...(monthlyData.monthly[0]?.avgTarget
          ? [
              {
                label: "Target (Per Car)",
                data: monthlyData.monthly.map((m) => m.avgTarget),
                backgroundColor: "#ffc107",
                borderColor: "#ffc107",
                borderWidth: 2,
                borderDash: [5, 5],
                type: "line",
                fill: false,
              },
            ]
          : []),
      ],
    };
  }, [monthlyData, color]);

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

  const currentData = viewMode === "daily" ? dailyData : monthlyData;
  const monthlyStats = dailyData?.monthly;

  return (
    <Box sx={{ p: 3, bgcolor: "#1a2332", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <Icon sx={{ fontSize: 40, color }} />
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700 }}>
          {metricLabel} Dashboard {year}
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <Select
              value={String(year)}
              onChange={(e) => setYear(parseInt(e.target.value))}
              sx={{
                bgcolor: "#0d1521",
                color: "#fff",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3a4a5a" },
              }}
            >
              {availableYears.map((y) => (
                <MenuItem key={y} value={String(y)}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <Select
              value={String(month)}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              disabled={viewMode === "monthly"}
              sx={{
                bgcolor: "#0d1521",
                color: "#fff",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3a4a5a" },
              }}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m.value} value={String(m.value)}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => setViewMode(newMode)}
            fullWidth
            sx={{
              "& .MuiToggleButton-root": {
                color: "#8899a6",
                borderColor: "#3a4a5a",
                "&.Mui-selected": { bgcolor: color, color: "#fff" },
              },
            }}
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        <Grid item xs={12} sm={3}>
          <ToggleButtonGroup
            value={dataFilter}
            exclusive
            onChange={(e, newFilter) => setDataFilter(newFilter)}
            fullWidth
            sx={{
              "& .MuiToggleButton-root": {
                color: "#8899a6",
                borderColor: "#3a4a5a",
                fontSize: "0.85rem",
                "&.Mui-selected": { bgcolor: "#ff6b6b", color: "#fff" },
              },
            }}
          >
            <ToggleButton value="all">All Days</ToggleButton>
            <ToggleButton value="npd">NPD Only</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      {/* Summary Cards */}
      {currentData && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Total Actual
              </Typography>
              <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
                {currentData.monthly
                  ? currentData.monthly[0]?.totalActual.toLocaleString("en-IN")
                  : currentData.daily.reduce((s, d) => s + d.actual, 0).toLocaleString("en-IN")}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Avg Per-Car
              </Typography>
              <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
                {currentData.monthly ? currentData.monthly[0]?.avgPerCar : monthlyStats?.avgPerCar}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Target
              </Typography>
              <Typography variant="h6" sx={{ color: "#ff9800", fontWeight: 700 }}>
                {currentData.monthly
                  ? currentData.monthly[0]?.avgTarget
                  : monthlyStats?.avgTarget || "N/A"}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Achieved %
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: (currentData.monthly
                    ? currentData.monthly[0]?.achievedPercent
                    : monthlyStats?.achievedPercent) >= 100
                    ? "#4caf50"
                    : "#ff6b6b",
                  fontWeight: 700,
                }}
              >
                {currentData.monthly ? currentData.monthly[0]?.achievedPercent : monthlyStats?.achievedPercent}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, bgcolor: "#0d1521", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Cars Count
              </Typography>
              <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
                {currentData.monthly
                  ? currentData.monthly[0]?.totalProduction.toLocaleString("en-IN")
                  : monthlyStats?.totalProduction.toLocaleString("en-IN")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {viewMode === "daily" && dailyData && dataFilter === "all" && (
        <Paper sx={{ p: 3, bgcolor: "#243447", borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            📊 Daily Consumption - {MONTHS[month].label}
          </Typography>
          <Box sx={{ height: 450 }}>
            <Bar data={dailyHistogramData()} options={chartOptions} />
          </Box>
        </Paper>
      )}

      {viewMode === "daily" && dailyData && dataFilter === "npd" && (
        <Paper sx={{ p: 3, bgcolor: "#243447", borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            📊 NPD Days Consumption - {MONTHS[month].label}
          </Typography>
          <Box sx={{ height: 450 }}>
            <Bar data={dailyHistogramData()} options={chartOptions} />
          </Box>
        </Paper>
      )}

      {viewMode === "monthly" && monthlyData && (
        <Paper sx={{ p: 3, bgcolor: "#243447", borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            📊 Monthly Comparison - {year}
          </Typography>
          <Box sx={{ height: 350 }}>
            <Bar data={monthlyBarData()} options={chartOptions} />
          </Box>
        </Paper>
      )}

      {/* ============ NPD ONLY TABLE ============ */}
      {viewMode === "daily" && dailyData && dataFilter === "npd" && (
        <Paper sx={{ p: 3, bgcolor: "#243447", borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            🔴 NPD Days - {MONTHS[month].label} {year}
          </Typography>
          <TableContainer sx={{ maxHeight: 500, bgcolor: "#1a2a3a", borderRadius: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#0d1521" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Date</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Production</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Consumption</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filterNPDDays(dailyData.daily).length > 0 ? (
                  <>
                    {filterNPDDays(dailyData.daily).map((row, idx) => (
                      <TableRow key={idx} sx={{ bgcolor: "#3a2a2a", borderColor: "#3a4a5a", "&:hover": { bgcolor: "#4a3a3a" } }}>
                        <TableCell sx={{ color: "#ff9800", fontWeight: 700, borderColor: "#3a4a5a" }}>
                          {row.label} 🔴
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#ff9800", fontWeight: 600, borderColor: "#3a4a5a" }}>
                          0
                        </TableCell>
                        <TableCell align="right" sx={{ color, fontWeight: 600, borderColor: "#3a4a5a" }}>
                          {typeof row.actual === "number" ? row.actual.toLocaleString("en-IN") : row.actual}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total NPD Row */}
                    <TableRow sx={{ bgcolor: "#0d1521", fontWeight: 700 }}>
                      <TableCell sx={{ color: "#ff9800", fontWeight: 700, borderColor: "#3a4a5a" }}>📊 Total NPD</TableCell>
                      <TableCell align="right" sx={{ color: "#ff9800", fontWeight: 700, borderColor: "#3a4a5a" }}>
                        {filterNPDDays(dailyData.daily).length} days
                      </TableCell>
                      <TableCell align="right" sx={{ color, fontWeight: 700, borderColor: "#3a4a5a" }}>
                        {filterNPDDays(dailyData.daily).reduce((sum, d) => sum + d.actual, 0).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ color: "#8899a6", py: 3 }}>
                      No NPD days in {MONTHS[month].label}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {/* ============ ALL DAYS TABLE ============ */}
      {viewMode === "daily" && dailyData && dataFilter === "all" && (
        <Paper sx={{ p: 3, bgcolor: "#243447", borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            📋 All Days - {MONTHS[month].label} {year}
          </Typography>
          <TableContainer sx={{ maxHeight: 500, bgcolor: "#1a2a3a", borderRadius: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#0d1521" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Date</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Production</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Consumption</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailyData.daily.map((row, idx) => {
                  const isNPD = !row.production || row.production === 0;
                  const rowBgColor = isNPD ? "#3a2a2a" : idx % 2 === 0 ? "#243447" : "#1a2a3a";
                  
                  return (
                    <TableRow key={idx} sx={{ bgcolor: rowBgColor, borderColor: "#3a4a5a", "&:hover": { bgcolor: "#2a3a4a" } }}>
                      <TableCell sx={{ color: isNPD ? "#ff9800" : "#fff", fontWeight: isNPD ? 700 : 600, borderColor: "#3a4a5a" }}>
                        {row.label} {isNPD ? "🔴" : ""}
                      </TableCell>
                      <TableCell align="right" sx={{ color: isNPD ? "#ff9800" : color, fontWeight: 600, borderColor: "#3a4a5a" }}>
                        {row.production || 0}
                      </TableCell>
                      <TableCell align="right" sx={{ color, fontWeight: 600, borderColor: "#3a4a5a" }}>
                        {typeof row.actual === "number" ? row.actual.toLocaleString("en-IN") : row.actual}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Total Row */}
                <TableRow sx={{ bgcolor: "#0d1521", fontWeight: 700 }}>
                  <TableCell sx={{ color: "#4fc3f7", fontWeight: 700, borderColor: "#3a4a5a" }}>📊 Total</TableCell>
                  <TableCell align="right" sx={{ color: "#4fc3f7", fontWeight: 700, borderColor: "#3a4a5a" }}>
                    {dailyData.daily.length} days
                  </TableCell>
                  <TableCell align="right" sx={{ color, fontWeight: 700, borderColor: "#3a4a5a" }}>
                    {dailyData.daily.reduce((sum, d) => sum + d.actual, 0).toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Monthly Details Table */}
      {viewMode === "monthly" && monthlyData && (
        <Paper sx={{ p: 3, bgcolor: "#243447", borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            📋 Monthly Summary - {year}
          </Typography>
          <TableContainer sx={{ maxHeight: 400, bgcolor: "#1a2a3a", borderRadius: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#0d1521" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Month</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Total Actual</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Avg Per-Car</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Target Per-Car</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Cars Produced</TableCell>
                  <TableCell align="right" sx={{ color: "#fff", fontWeight: 700, borderColor: "#3a4a5a" }}>Achieved %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.monthly.map((row, idx) => {
                  const achieved = row.avgTarget ? ((row.avgPerCar / row.avgTarget) * 100).toFixed(1) : "N/A";
                  const achievedColor = achieved === "N/A" ? "#8899a6" : achieved >= 100 ? "#4caf50" : "#ff6b6b";
                  
                  return (
                    <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? "#243447" : "#1a2a3a", borderColor: "#3a4a5a", "&:hover": { bgcolor: "#2a3a4a" } }}>
                      <TableCell sx={{ color: "#fff", fontWeight: 600, borderColor: "#3a4a5a" }}>{row.month}</TableCell>
                      <TableCell align="right" sx={{ color, fontWeight: 600, borderColor: "#3a4a5a" }}>
                        {row.totalActual.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right" sx={{ color, fontWeight: 600, borderColor: "#3a4a5a" }}>
                        {row.avgPerCar.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#ffc107", fontWeight: 600, borderColor: "#3a4a5a" }}>
                        {row.avgTarget ? row.avgTarget.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "N/A"}
                      </TableCell>
                      <TableCell align="right" sx={{ color, fontWeight: 600, borderColor: "#3a4a5a" }}>
                        {row.totalProduction.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right" sx={{ color: achievedColor, fontWeight: 700, borderColor: "#3a4a5a" }}>
                        {achieved}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default MetricPage;
