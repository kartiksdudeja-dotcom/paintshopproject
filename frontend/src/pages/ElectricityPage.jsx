import React from "react";
import MetricPage from "../components/MetricPage";
import BoltIcon from "@mui/icons-material/Bolt";

const ElectricityPage = () => {
  return (
    <MetricPage
      metricType="electricity"
      metricLabel="Electricity Consumption"
      icon={BoltIcon}
      color="#ffc107"
    />
  );
};

export default ElectricityPage;
