import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import OpacityIcon from "@mui/icons-material/Opacity";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";

const cardStyle = {
  p: 3,
  display: "flex",
  alignItems: "center",
  gap: 2,
  borderRadius: "22px",
  transition: "all 0.25s ease",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
  },
};

const iconBox = {
  width: 60,
  height: 60,
  borderRadius: "18px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export default function StatsCards({ summary }) {
  return (
    <Grid container spacing={3}>

      {/* ELECTRICITY CARD */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ ...cardStyle, background: "linear-gradient(135deg, #ffe3c9, #fff3e3)" }}>
          <Box sx={{ ...iconBox, background: "#ffedd5" }}>
            <BoltIcon sx={{ fontSize: 34, color: "#f59e0b" }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: "#7c7f84", fontWeight: 500 }}>
              Electricity (kWh)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {summary.electricity ?? 0}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* WATER CARD */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ ...cardStyle, background: "linear-gradient(135deg, #d7edff, #e9f6ff)" }}>
          <Box sx={{ ...iconBox, background: "#dbeafe" }}>
            <OpacityIcon sx={{ fontSize: 34, color: "#3b82f6" }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: "#7c7f84", fontWeight: 500 }}>
              Water (KL)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {summary.water ?? 0}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* CNG CARD */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ ...cardStyle, background: "linear-gradient(135deg, #ffe1ea, #fff0f5)" }}>
          <Box sx={{ ...iconBox, background: "#ffe4e6" }}>
            <LocalGasStationIcon sx={{ fontSize: 34, color: "#e11d48" }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: "#7c7f84", fontWeight: 500 }}>
              CNG (Kg)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {summary.cng ?? 0}
            </Typography>
          </Box>
        </Paper>
      </Grid>

    </Grid>
  );
}
