import React from "react";
import { ResponsiveContainer } from "recharts";

export default function ChartCard({ title, children }) {
  return (
    <div className="chart">
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={260}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
