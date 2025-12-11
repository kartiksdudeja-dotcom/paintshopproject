import React from "react";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";

export default function TopBar() {
  return (
    <AppBar
      position="static"
      sx={{
        background: "#ffffff",
        color: "#000",
        paddingY: 1,
        borderRadius: "0 0 18px 18px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
      }}
      elevation={0}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        
        {/* LEFT SIDE BRANDING */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          
          {/* Small green accent bar */}
          <Box
            sx={{
              width: 6,
              height: 38,
              borderRadius: "4px",
              background: "#4BA82E", // Škoda Green
            }}
          />
          
          {/* Logos visible now */}
          <img
            src="/skoda-logo.png"
            alt="Skoda"
            width="32"
          />
          <img
            src="/vw-logo.png"
            alt="Volkswagen"
            width="32"
          />

          <Typography
            variant="h6"
            sx={{
              ml: 2,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "0.5px",
            }}
          >
            ŠKODA VOLKSWAGEN — Energy Dashboard
          </Typography>
        </Box>

        {/* RIGHT SIDE */}
        <Typography
          sx={{
            fontWeight: 500,
            color: "#4BA82E", // green highlight
            mr: 2,
          }}
        >
          Internal Monitoring System
        </Typography>
      </Toolbar>

      {/* GREEN ACCENT LINE UNDER BAR */}
      <Box
        sx={{
          width: "100%",
          height: 6,
          background: "#4BA82E",
        }}
      />
    </AppBar>
  );
}
