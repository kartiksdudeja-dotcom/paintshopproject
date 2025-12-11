import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography
} from "@mui/material";

export default function LocationTable({ locations = [] }) {
  const [search, setSearch] = useState("");

  if (!locations.length) {
    return <Typography variant="body2" sx={{ color: "#8899a6" }}>No data available for selected period</Typography>;
  }

  const filtered = locations.filter((row) =>
    (row.label || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Search bar */}
      <TextField
        label="Search Date"
        placeholder="e.g. Jan, Feb, 5 Jan"
        fullWidth
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            bgcolor: "#1a2a3a",
            color: "#fff",
            "& fieldset": { borderColor: "#3a4a5a" },
            "&:hover fieldset": { borderColor: "#4fc3f7" },
          },
          "& .MuiInputLabel-root": { color: "#8899a6" },
        }}
      />

      {/* Scrollable table */}
      <TableContainer sx={{ maxHeight: 400, bgcolor: "#1a2a3a", borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: "#0d1521", color: "#4fc3f7", borderBottom: "1px solid #3a4a5a" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "#0d1521", color: "#4caf50", borderBottom: "1px solid #3a4a5a" }}>Production</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "#0d1521", color: "#ffeb3b", borderBottom: "1px solid #3a4a5a" }}>Electricity (kWh)</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "#0d1521", color: "#2196f3", borderBottom: "1px solid #3a4a5a" }}>Water (m³)</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "#0d1521", color: "#ff9800", borderBottom: "1px solid #3a4a5a" }}>CNG (SCM)</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "#0d1521", color: "#9c27b0", borderBottom: "1px solid #3a4a5a" }}>Air (m³)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((row, i) => (
              <TableRow
                key={i}
                sx={{
                  "&:nth-of-type(odd)": { bgcolor: "rgba(255,255,255,0.02)" },
                  "&:hover": { bgcolor: "rgba(79, 195, 247, 0.1)", cursor: "pointer" },
                }}
              >
                <TableCell sx={{ color: "#fff", borderBottom: "1px solid #2a3a4a" }}>{row.label}</TableCell>
                <TableCell sx={{ color: "#4caf50", borderBottom: "1px solid #2a3a4a" }}>{Math.round(row.production || 0).toLocaleString("en-IN")}</TableCell>
                <TableCell sx={{ color: "#ffeb3b", borderBottom: "1px solid #2a3a4a" }}>{Math.round(row.electricity || 0).toLocaleString("en-IN")}</TableCell>
                <TableCell sx={{ color: "#2196f3", borderBottom: "1px solid #2a3a4a" }}>{Math.round(row.water || 0).toLocaleString("en-IN")}</TableCell>
                <TableCell sx={{ color: "#ff9800", borderBottom: "1px solid #2a3a4a" }}>{Math.round(row.cng || 0).toLocaleString("en-IN")}</TableCell>
                <TableCell sx={{ color: "#9c27b0", borderBottom: "1px solid #2a3a4a" }}>{Math.round(row.air || 0).toLocaleString("en-IN")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
