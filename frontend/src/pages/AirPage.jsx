import React from "react";
import MetricPage from "../components/MetricPage";
import AirIcon from "@mui/icons-material/Cloud";

const AirPage = () => {
  return (
    <MetricPage
      metricType="air"
      metricLabel="Air Consumption"
      icon={AirIcon}
      color="#9c27b0"
    />
  );
};

export default AirPage;
