import React, { useState } from "react";
import { Box, Button, Typography, Checkbox, FormControlLabel, Alert, CircularProgress } from "@mui/material";
import axios from "axios";

const BASE = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

export default function UploadPage({ onUpload }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info"); // "success", "error", "info"
  const [clearOldData, setClearOldData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleClearData = async () => {
    try {
      const res = await axios.delete(`${BASE}/api/upload/clear`);
      return res.data;
    } catch (err) {
      console.error("Clear data error:", err);
      throw err;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMsg("Please select a file first");
      setMsgType("error");
      return;
    }

    setLoading(true);
    setMsg("");
    setUploadResult(null);

    try {
      // Clear old data if checkbox is checked
      if (clearOldData) {
        setMsg("Clearing old data...");
        await handleClearData();
      }

      // Upload new file
      setMsg("Uploading and processing file...");
      const fd = new FormData();
      fd.append("file", file);
      
      const res = await axios.post(`${BASE}/api/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setUploadResult(res.data);
      setMsg(`✅ Upload successful! ${res.data.inserted || 0} rows imported.`);
      setMsgType("success");
      setFile(null);
      
      // Auto-refresh dashboard after 1 second
      setTimeout(() => {
        if (onUpload) onUpload();
      }, 1000);

    } catch (err) {
      console.error("Upload error:", err);
      setMsg("❌ Upload failed: " + (err.response?.data?.error || err.message));
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>Upload Excel File</Typography>
      
      <Typography variant="body2" sx={{ color: "#8899a6", mb: 2 }}>
        Upload your Excel file with multiple year sheets. All sheets will be processed automatically.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={clearOldData}
              onChange={(e) => setClearOldData(e.target.checked)}
              sx={{ color: "#4fc3f7", "&.Mui-checked": { color: "#4fc3f7" } }}
            />
          }
          label={<Typography sx={{ color: "#8899a6" }}>Clear existing data before upload</Typography>}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          component="label"
          sx={{
            color: "#4fc3f7",
            borderColor: "#4fc3f7",
            "&:hover": { bgcolor: "rgba(79, 195, 247, 0.1)" },
          }}
        >
          Choose File
          <input 
            type="file" 
            hidden
            accept=".xlsx,.xls,.csv" 
            onChange={(e) => {
              setFile(e.target.files[0]);
              setMsg("");
              setUploadResult(null);
            }} 
            disabled={loading}
          />
        </Button>

        {file && (
          <Typography variant="body2" sx={{ color: "#fff" }}>
            📄 {file.name}
          </Typography>
        )}
        
        <Button 
          variant="contained" 
          onClick={handleUpload}
          disabled={loading || !file}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}
        >
          {loading ? "Processing..." : "Upload & Import"}
        </Button>
        
        <Button 
          variant="text" 
          onClick={() => { 
            setFile(null); 
            setMsg(""); 
            setUploadResult(null);
            if (onUpload) onUpload();
          }}
          disabled={loading}
          sx={{ color: "#8899a6" }}
        >
          Cancel
        </Button>
      </Box>

      {msg && (
        <Alert severity={msgType} sx={{ mt: 2 }}>
          {msg}
        </Alert>
      )}

      {uploadResult && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "#1a2a3a", borderRadius: 2, border: "1px solid #3a4a5a" }}>
          <Typography variant="subtitle2" sx={{ color: "#4fc3f7", mb: 1 }}>Import Summary:</Typography>
          <Typography variant="body2" sx={{ color: "#4caf50" }}>✓ Sheets processed: {uploadResult.sheetsProcessed || 1}</Typography>
          <Typography variant="body2" sx={{ color: "#4caf50" }}>✓ Rows inserted: {uploadResult.totalInserted || uploadResult.inserted || 0}</Typography>
          <Typography variant="body2" sx={{ color: "#ff9800" }}>⚠ Rows skipped: {uploadResult.totalSkipped || uploadResult.skipped || 0}</Typography>
          
          {uploadResult.byYear && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: "#8899a6" }}>
                Years: {Object.keys(uploadResult.byYear).join(", ")}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
