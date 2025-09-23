import React from "react";
import HeatMap from "@uiw/react-heat-map";

// The main change is here, providing a better color range for a dark theme.
const panelColors = {
  0: "#161b22", // Background color
  4: "#0e4429",
  8: "#006d32",
  12: "#26a641",
  32: "#39d353",
};

// Dummy data for demonstration purposes
const generateActivityData = (startDate, endDate) => {
  const data = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  while (currentDate <= end) {
    const count = Math.floor(Math.random() * 35); // Adjusted max count
    data.push({
      date: currentDate.toISOString().split("T")[0],
      count: count,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const HeatMapProfile = () => {
  const activityData = generateActivityData("2025-01-01", "2025-12-31");

  return (
    <HeatMap
      value={activityData}
      width="100%"
      style={{ color: "#c9d1d9" }}
      startDate={new Date("2025-01-01")}
      panelColors={panelColors}
      rectSize={12}
      space={3}
      rectProps={{
        rx: 3,
      }}
    />
  );
};

export default HeatMapProfile;
