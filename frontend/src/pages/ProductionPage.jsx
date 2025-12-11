import React from "react";
import MetricPage from "../components/MetricPage";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

const ProductionPage = () => {
  return (
    <MetricPage
      metricType="production"
      metricLabel="Production Count"
      icon={DirectionsCarIcon}
      color="#00a86b"
    />
  );
};

export default ProductionPage;
