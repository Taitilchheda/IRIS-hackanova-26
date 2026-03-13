import { useState } from "react";

interface CenterPanelProps {}

export function CenterPanel({}: CenterPanelProps) {
  const [activeChart, setActiveChart] = useState("equity");
  const [showGrid, setShowGrid] = useState(true);

  const chartTabs = [
    { id: "equity", name: "EQUITY CURVE" },
    { id: "drawdown", name: "DRAWDOWN" },
    { id: "returns", name: "RETURNS" },
    { id: "volume", name: "VOLUME" },
  ];

  const handleChartClick = (chartId: string) => {
    alert(`Switching to ${chartId.toUpperCase()} chart view`);
    setActiveChart(chartId);
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    alert(`Grid ${showGrid ? 'disabled' : 'enabled'}`);
  };

  return (
    <div id="center">
      {/* Chart Tabs */}
      <div id="chart-tabs">
        <div className="ct-tabs">
          {chartTabs.map((tab) => (
            <div
              key={tab.id}
              className={`ct-tab ${activeChart === tab.id ? "active" : ""}`}
              onClick={() => handleChartClick(tab.id)}
            >
              {tab.name}
            </div>
          ))}
        </div>
        <div className="ct-right">
          <div
            className={`ct-toggle ${showGrid ? "on" : ""}`}
            onClick={toggleGrid}
          >
            GRID
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div id="charts-area">
        {/* Main Chart */}
        <div className="chart-pane">
          <div className="pane-label">
            EQUITY <span>$125,432</span>
          </div>
          <canvas id="mainChart"></canvas>
        </div>

        {/* Returns Distribution */}
        <div className="chart-pane">
          <div className="pane-label">
            RETURNS <span>+2.34%</span>
          </div>
          <canvas id="returnsChart"></canvas>
        </div>

        {/* Volume Chart */}
        <div className="chart-pane">
          <div className="pane-label">
            VOLUME <span>1.2M</span>
          </div>
          <canvas id="volumeChart"></canvas>
        </div>
      </div>

      {/* Crosshair Overlay */}
      <div id="crosshair">
        <div className="ch-tooltip">
          <div className="ch-row">
            <span>Date:</span>
            <span>2024-01-15</span>
          </div>
          <div className="ch-row">
            <span>Price:</span>
            <span>$213.47</span>
          </div>
          <div className="ch-row">
            <span>Volume:</span>
            <span>45.2K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
