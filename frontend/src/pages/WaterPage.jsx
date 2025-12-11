import React from "react";
import MetricPage from "../components/MetricPage";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

const WaterPage = () => {
  return (
    <MetricPage
      metricType="water"
      metricLabel="Water Consumption"
      icon={WaterDropIcon}
      color="#00bcd4"
    />
  );
};

export default WaterPage;
