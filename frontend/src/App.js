import React from "react";
import { CssBaseline, Box, AppBar, Toolbar, Button } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ProductionPage from "./pages/ProductionPage";
import ElectricityPage from "./pages/ElectricityPage";
import WaterPage from "./pages/WaterPage";
import CNGPage from "./pages/CNGPage";
import AirPage from "./pages/AirPage";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import BoltIcon from "@mui/icons-material/Bolt";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import CloudIcon from "@mui/icons-material/Cloud";
import DashboardIcon from "@mui/icons-material/Dashboard";

// Dark theme for the dashboard
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4fc3f7",
    },
    background: {
      default: "#1a2332",
      paper: "#243447",
    },
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },
});

const NavBar = () => {
  return (
    <AppBar position="sticky" sx={{ bgcolor: "#0d1521", borderBottom: "1px solid #3a4a5a" }}>
      <Toolbar sx={{ display: "flex", gap: 1, overflowX: "auto" }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            sx={{
              color: "#fff",
              display: "flex",
              gap: 1,
              textTransform: "none",
              fontSize: 14,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#1a2f42" },
            }}
          >
            <DashboardIcon sx={{ fontSize: 20 }} />
            Dashboard
          </Button>
        </Link>

        <Box sx={{ height: 24, width: 1, bgcolor: "#3a4a5a", mx: 1 }} />

        <Link to="/production" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Button
            sx={{
              color: "#00a86b",
              display: "flex",
              gap: 0.5,
              textTransform: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#1a2f42" },
            }}
          >
            <DirectionsCarIcon sx={{ fontSize: 18 }} />
            Production
          </Button>
        </Link>

        <Link to="/electricity" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Button
            sx={{
              color: "#ffc107",
              display: "flex",
              gap: 0.5,
              textTransform: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#1a2f42" },
            }}
          >
            <BoltIcon sx={{ fontSize: 18 }} />
            Electricity
          </Button>
        </Link>

        <Link to="/water" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Button
            sx={{
              color: "#00bcd4",
              display: "flex",
              gap: 0.5,
              textTransform: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#1a2f42" },
            }}
          >
            <WaterDropIcon sx={{ fontSize: 18 }} />
            Water
          </Button>
        </Link>

        <Link to="/cng" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Button
            sx={{
              color: "#ff9800",
              display: "flex",
              gap: 0.5,
              textTransform: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#1a2f42" },
            }}
          >
            <LocalGasStationIcon sx={{ fontSize: 18 }} />
            CNG
          </Button>
        </Link>

        <Link to="/air" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Button
            sx={{
              color: "#9c27b0",
              display: "flex",
              gap: 0.5,
              textTransform: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#1a2f42" },
            }}
          >
            <CloudIcon sx={{ fontSize: 18 }} />
            Air
          </Button>
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <NavBar />
        <Box sx={{ minHeight: "100vh", bgcolor: "#1a2332" }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/electricity" element={<ElectricityPage />} />
            <Route path="/water" element={<WaterPage />} />
            <Route path="/cng" element={<CNGPage />} />
            <Route path="/air" element={<AirPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}
