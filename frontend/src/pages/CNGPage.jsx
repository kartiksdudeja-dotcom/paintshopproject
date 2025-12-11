import React from "react";
import MetricPage from "../components/MetricPage";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";

const CNGPage = () => {
  return (
    <MetricPage
      metricType="cng"
      metricLabel="CNG Consumption"
      icon={LocalGasStationIcon}
      color="#ff9800"
    />
  );
};

export default CNGPage;
