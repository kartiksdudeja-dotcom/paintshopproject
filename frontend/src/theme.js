import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  shape: {
    borderRadius: 18,
  },
  palette: {
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
    primary: {
      main: "#4c84ff",
    },
    secondary: {
      main: "#ff7d6e",
    },
    info: {
      main: "#50c2ff",
    },
    warning: {
      main: "#ffcf5c",
    },
    success: {
      main: "#5ad67d",
    },
  },
  typography: {
    fontFamily: "Inter, Roboto, sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body2: { color: "#6b7280" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          padding: "20px",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: "600",
        },
      },
    },
  },
});
