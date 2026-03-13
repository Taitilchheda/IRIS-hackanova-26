import { useState } from "react";

interface LeftPanelProps {}

export function LeftPanel({}: LeftPanelProps) {
  const [strategy, setStrategy] = useState(
    "Buy AAPL when 50-day MA crosses above 200-day MA. Sell when RSI > 70 or position drops 5% from entry. Risk 2% capital per trade."
  );
  const [capital, setCapital] = useState(100000);
  const [commission, setCommission] = useState(10);
  const [slippage, setSlippage] = useState(5);
  const [maxPosition, setMaxPosition] = useState(100);
  const [monteCarloPaths, setMonteCarloPaths] = useState(1000);
  const [selectedAlgo, setSelectedAlgo] = useState("risk");

  const algorithms = [
    { id: "risk", name: "Risk Analysis", tag: "MONTE CARLO", type: "tag-risk" },
    { id: "alpha", name: "Alpha / Signal", tag: "KALMAN", type: "tag-alpha" },
    { id: "port", name: "Portfolio Const.", tag: "BLACK-LITTERMAN", type: "tag-port" },
    { id: "deriv", name: "Derivatives", tag: "BLACK-SCHOLES", type: "tag-deriv" },
    { id: "micro", name: "Microstructure", tag: "HMM + VWAP", type: "tag-alpha" },
    { id: "fi", name: "Fixed Income", tag: "VASICEK", type: "tag-port" },
  ];

  const agentPipeline = [
    { name: "Manager Agent", time: "0.3s", status: "done" },
    { name: "Trader Strategy", time: "1.2s", status: "done" },
    { name: "Risk Analysis", time: "0.9s", status: "done" },
    { name: "Verifier", time: "0.1s", status: "done" },
    { name: "Comparator", time: "0.2s", status: "done" },
  ];

  return (
    <div id="left">
      {/* Strategy Input */}
      <div className="lp-section">
        <div className="section-hdr">
          STRATEGY INPUT
          <span 
            className="section-hdr-btn" 
            onClick={() => setStrategy("Buy AAPL when 50-day MA crosses above 200-day MA. Sell when RSI > 70 or position drops 5% from entry. Risk 2% capital per trade.")}
          >
            EXAMPLE
          </span>
        </div>
        <textarea
          id="stratInput"
          placeholder="Describe strategy in plain English..."
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        />
      </div>

      {/* Universe & Period */}
      <div className="lp-section">
        <div className="section-hdr">UNIVERSE & PERIOD</div>
        <div className="inp-row">
          <div className="inp-label">ASSET</div>
          <select className="ctrl-select" id="assetSel">
            <option>AAPL</option>
            <option>SPY</option>
            <option>MSFT</option>
            <option>TSLA</option>
            <option>GS</option>
            <option>JPM</option>
            <option>QQQ</option>
            <option>BTC-USD</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div className="inp-row">
            <div className="inp-label">FROM</div>
            <input className="ctrl-input" value="2019-01-01" id="dateFrom" />
          </div>
          <div className="inp-row">
            <div className="inp-label">TO</div>
            <input className="ctrl-input" value="2024-12-31" id="dateTo" />
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="lp-section">
        <div className="section-hdr">PARAMETERS</div>
        <div className="ctrl-row">
          <span className="ctrl-label">CAPITAL</span>
          <span className="ctrl-val">${capital.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="10000"
          max="1000000"
          step="10000"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
        />
        
        <div className="ctrl-row">
          <span className="ctrl-label">COMMISSION bps</span>
          <span className="ctrl-val">{commission} bps</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={commission}
          onChange={(e) => setCommission(Number(e.target.value))}
        />
        
        <div className="ctrl-row">
          <span className="ctrl-label">SLIPPAGE bps</span>
          <span className="ctrl-val">{slippage} bps</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={slippage}
          onChange={(e) => setSlippage(Number(e.target.value))}
        />
        
        <div className="ctrl-row">
          <span className="ctrl-label">MAX POSITION %</span>
          <span className="ctrl-val">{maxPosition}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={maxPosition}
          onChange={(e) => setMaxPosition(Number(e.target.value))}
        />
        
        <div className="ctrl-row">
          <span className="ctrl-label">MONTE CARLO PATHS</span>
          <span className="ctrl-val">{monteCarloPaths.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={monteCarloPaths}
          onChange={(e) => setMonteCarloPaths(Number(e.target.value))}
        />
      </div>

      {/* Expert Benchmark */}
      <div className="lp-section">
        <div className="section-hdr">EXPERT BENCHMARK</div>
        <div className="algo-list">
          {algorithms.map((algo) => (
            <div
              key={algo.id}
              className={`algo-item ${selectedAlgo === algo.id ? "active" : ""}`}
              onClick={() => setSelectedAlgo(algo.id)}
            >
              <span className="algo-name">{algo.name}</span>
              <span className={`algo-tag ${algo.type}`}>{algo.tag}</span>
            </div>
          ))}
        </div>
        <button 
          className="run-btn" 
          onClick={() => {
            alert(`Running IRIS with strategy: ${strategy.substring(0, 50)}...`);
          }}
        >
          ▶ RUN IRIS
        </button>
      </div>

      {/* Agent Pipeline */}
      <div className="lp-section" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="section-hdr">AGENT PIPELINE</div>
        <div className="agent-pipeline">
          {agentPipeline.map((agent, index) => (
            <div key={index} className="ag-row">
              <div className={`ag-dot dot-${agent.status}`}></div>
              <div className="ag-name">{agent.name}</div>
              <div className="ag-time">{agent.time}</div>
              <div className={`ag-status st-${agent.status}`}>
                {agent.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
