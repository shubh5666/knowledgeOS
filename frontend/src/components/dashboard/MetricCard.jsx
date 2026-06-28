import React from "react";

export default function MetricCard({
  icon: Icon,
  value = 0,
  label,
  isActive = false,
  colorClass = "blue",
  onClick,
}) {
  return (
    <div 
      className={`metric-card ${isActive ? "active-tab-card" : ""}`}
      onClick={onClick}
    >
      <div className={`metric-icon-wrapper ${colorClass}`}>
        <Icon size={28} />
      </div>
      <div className="metric-details">
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
      </div>
    </div>
  );
}
