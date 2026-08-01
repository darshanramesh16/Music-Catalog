import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import { api, errorMessage } from "../utils/api";

function SkeletonChart() {
  return (
    <div className="chart card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-chart-title" />
      <div className="skeleton skeleton-chart-body" />
    </div>
  );
}

function SkeletonInsights() {
  return (
    <div className="insights card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-chart-title" />
      <div className="skeleton skeleton-insights-line" />
      <div className="skeleton skeleton-insights-line" style={{ width: "85%" }} />
      <div className="skeleton skeleton-insights-line" style={{ width: "60%" }} />
      <div className="skeleton skeleton-btn" style={{ marginTop: "14px" }} />
    </div>
  );
}

const COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [insight, setInsight] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/analytics")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  const insightLines = insight
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletLines = insightLines.filter((line) => /^[•\-*]\s+/.test(line));
  const sentenceLines = !bulletLines.length && insight
    ? insight
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 18)
    : [];
  const contentLines = bulletLines.length
    ? bulletLines
    : sentenceLines.length
    ? sentenceLines
    : insightLines;

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      setInsight((await api.post("/ai/insights")).data.summary);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <div className="error">{error}</div>;
  if (!data)
    return (
      <section>
        <h1>Analytics</h1>
        <div className="charts">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonInsights />
      </section>
    );
  if (!data.totalAlbums)
    return (
      <section>
        <h1>Analytics</h1>
        <p className="empty">
          Add a few albums to your library to see your personal insights.
        </p>
      </section>
    );

  const releasesByYear = [...data.releasesByYear].sort(
    (a, b) => Number(a.name) - Number(b.name),
  );
  const trackDistribution = data.trackDistribution;

  return (
    <section>
      <h1>Analytics</h1>
      {error && <div className="error">{error}</div>}
      <div className="charts">
        <ChartCard title="Albums by genre">
          <PieChart>
            <Pie
              data={data.genres}
              dataKey="count"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
            >
              {data.genres.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>
        <ChartCard title="Top artists">
          <BarChart data={data.artists} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={110} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ChartCard>
        <ChartCard title="Release-year distribution">
          <BarChart data={releasesByYear} barCategoryGap="8%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" />
          </BarChart>
        </ChartCard>
        <ChartCard title="Tracks per album">
          <BarChart data={trackDistribution} layout="vertical" margin={{ left: 16, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={90} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ChartCard>
      </div>
      <div className="insights">
        <h2>✨ AI Trend Summary</h2>
        {insight ? (
          <div>
            <ul>
              {contentLines.map((line, index) => (
                <li key={index}>{line.replace(/^[•\-*]\s+/, "")}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Generate a concise trend summary from your saved albums.</p>
        )}
        <button onClick={generate} disabled={busy}>
          {busy ? "Generating..." : insight ? "Regenerate Trend Summary" : "Generate Trend Summary"}
        </button>
      </div>
    </section>
  );
}
