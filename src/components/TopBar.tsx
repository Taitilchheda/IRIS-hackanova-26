import { useState } from "react";

interface TopBarProps {}

export function TopBar({}: TopBarProps) {
  const [activeTab, setActiveTab] = useState("STRATEGY LAB");

  const tabs = [
    "STRATEGY LAB",
    "PORTFOLIO",
    "RISK DESK",
    "SIGNALS",
    "EXECUTION"
  ];

  return (
    <div id="topbar">
      <div className="tb-logo">
        <div className="tb-logo-pulse"></div>
        IRIS
      </div>
      <div className="tb-tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`tb-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
      <div className="tb-right">
        <div className="tb-stat">
          <span className="tb-stat-label">AAPL</span>
          <span className="tb-stat-val kv-up">$213.47</span>
        </div>
        <div className="tb-divider"></div>
        <div className="tb-stat">
          <span className="tb-stat-label">VIX</span>
          <span className="tb-stat-val kv-nu">18.32</span>
        </div>
        <div className="tb-divider"></div>
        <div className="tb-stat">
          <span className="tb-stat-label">SPY</span>
          <span className="tb-stat-val kv-up">+0.84%</span>
        </div>
        <div className="tb-divider"></div>
        <div className="tb-stat">
          <span className="tb-stat-label">USD/JPY</span>
          <span className="tb-stat-val">148.92</span>
        </div>
        <div className="tb-divider"></div>
        <div className="tb-badge">PAPER ACTIVE</div>
      </div>
    </div>
  );
}
