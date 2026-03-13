import { useState } from "react";

interface RightPanelProps {}

export function RightPanel({}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState("metrics");

  const kpiData = [
    { label: "TOTAL RETURN", value: "+25.4%", change: "up" },
    { label: "SHARPE", value: "1.34", change: "up" },
    { label: "MAX DRAWDOWN", value: "-8.2%", change: "down" },
    { label: "WIN RATE", value: "62.3%", change: "nu" },
  ];

  const tradeLog = [
    { date: "2024-01-15", type: "buy", price: "$212.30", qty: "100", pnl: "+$2.34%" },
    { date: "2024-01-14", type: "sell", price: "$210.15", qty: "50", pnl: "-$0.82%" },
    { date: "2024-01-13", type: "buy", price: "$208.90", qty: "75", pnl: "+$1.15%" },
    { date: "2024-01-12", type: "buy", price: "$205.40", qty: "100", pnl: "+$3.21%" },
  ];

  const tabs = [
    { id: "metrics", name: "METRICS" },
    { id: "trades", name: "TRADES" },
    { id: "risk", name: "RISK" },
    { id: "analysis", name: "ANALYSIS" },
  ];

  return (
    <div id="right">
      {/* Tabs */}
      <div className="rp-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`rp-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="rp-content">
        {activeTab === "metrics" && (
          <>
            {/* KPI Grid */}
            <div className="kpi-grid">
              {kpiData.map((kpi, index) => (
                <div key={index} className="kpi">
                  <div className="kpi-l">{kpi.label}</div>
                  <div className={`kpi-v kv-${kpi.change}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Monte Carlo */}
            <div id="mc-canvas-wrap">
              <canvas id="mcCanvas"></canvas>
            </div>

            {/* Distribution */}
            <div id="dist-canvas-wrap">
              <canvas id="distCanvas"></canvas>
            </div>

            {/* IRIS Message */}
            <div className="iris-msg">
              <strong>IRIS Analysis:</strong> Strategy shows strong risk-adjusted returns with low correlation to market. Recommended allocation: 15% of portfolio.
            </div>

            {/* Automation Buttons */}
            <div className="auto-btns">
              <button 
                className="auto-btn auto-btn-primary"
                onClick={() => alert('Strategy automation initiated! This would connect to your trading API.')}
              >
                AUTOMATE
              </button>
              <button 
                className="auto-btn auto-btn-secondary"
                onClick={() => alert('Exporting strategy data... This would download CSV/JSON.')}
              >
                EXPORT
              </button>
            </div>
          </>
        )}

        {activeTab === "trades" && (
          <>
            {/* Trade Log Header */}
            <div className="tr-hdr">
              <div>DATE</div>
              <div>TYPE</div>
              <div>PRICE</div>
              <div>QTY</div>
              <div>PNL</div>
            </div>

            {/* Trade Log */}
            <div className="trade-log">
              {tradeLog.map((trade, index) => (
                <div key={index} className="tr-row">
                  <div>{trade.date}</div>
                  <div className={trade.type === "buy" ? "tr-buy" : "tr-sell"}>
                    {trade.type.toUpperCase()}
                  </div>
                  <div>{trade.price}</div>
                  <div>{trade.qty}</div>
                  <div className={trade.pnl.startsWith("+") ? "tr-pnl-pos" : "tr-pnl-neg"}>
                    {trade.pnl}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "risk" && (
          <>
            <div className="sub-hdr">RISK METRICS</div>
            
            {/* Rolling Metrics */}
            <div id="rolling-canvas-wrap">
              <canvas id="rollingCanvas"></canvas>
            </div>

            {/* Risk Decomposition */}
            <div className="sub-hdr">RISK DECOMPOSITION</div>
            <div className="risk-bar-row">
              <div className="risk-bar-label">Market</div>
              <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: "45%", background: "var(--teal)" }}></div>
              </div>
              <div className="risk-bar-val">45%</div>
            </div>
            <div className="risk-bar-row">
              <div className="risk-bar-label">Sector</div>
              <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: "25%", background: "var(--blue)" }}></div>
              </div>
              <div className="risk-bar-val">25%</div>
            </div>
            <div className="risk-bar-row">
              <div className="risk-bar-label">Idio</div>
              <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: "30%", background: "var(--amber)" }}></div>
              </div>
              <div className="risk-bar-val">30%</div>
            </div>
          </>
        )}

        {activeTab === "analysis" && (
          <>
            <div className="sub-hdr">ANALYSIS TOOLS</div>
            
            {/* Analysis Grid */}
            <div className="analysis-grid">
              <div 
                className="an-btn"
                onClick={() => alert('Opening correlation matrix analysis...')}
              >
                CORRELATION
              </div>
              <div 
                className="an-btn"
                onClick={() => alert('Loading market regime analysis...')}
              >
                REGIME
              </div>
              <div 
                className="an-btn"
                onClick={() => alert('Analyzing factor exposures...')}
              >
                FACTOR
              </div>
              <div 
                className="an-btn"
                onClick={() => alert('Running performance attribution...')}
              >
                ATTRIBUTION
              </div>
              <div 
                className="an-btn"
                onClick={() => alert('Running scenario analysis...')}
              >
                SCENARIOS
              </div>
              <div 
                className="an-btn"
                onClick={() => alert('Running stress tests...')}
              >
                STRESS
              </div>
            </div>

            {/* Regime Heatmap */}
            <div id="heatmap-wrap">
              <div className="sub-hdr">MARKET REGIMES</div>
              <div className="hm-row">
                <div className="hm-cell" style={{ background: "var(--green)" }}></div>
                <div className="hm-cell" style={{ background: "var(--green)" }}></div>
                <div className="hm-cell" style={{ background: "var(--teal)" }}></div>
                <div className="hm-cell" style={{ background: "var(--amber)" }}></div>
                <div className="hm-cell" style={{ background: "var(--red)" }}></div>
              </div>
              <div className="hm-row">
                <div className="hm-cell" style={{ background: "var(--teal)" }}></div>
                <div className="hm-cell" style={{ background: "var(--green)" }}></div>
                <div className="hm-cell" style={{ background: "var(--green)" }}></div>
                <div className="hm-cell" style={{ background: "var(--teal)" }}></div>
                <div className="hm-cell" style={{ background: "var(--amber)" }}></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
