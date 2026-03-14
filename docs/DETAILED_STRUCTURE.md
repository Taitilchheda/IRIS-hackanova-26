# IRIS — Full Project Structure (Investor Edition)

Complete annotated codebase. Every file has a clear purpose.

---

## Directory Tree

```
iris/
│
├── README.md
├── STRUCTURE.md                          ← this file
├── UI_README.md                          ← interface design spec
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── pyproject.toml
│
│
├── app/                                  ══ BACKEND (FastAPI) ══════════════════
│   │
│   ├── main.py                           Entry point. Registers all routers.
│   │                                     Adds CORS, logging, startup events.
│   │
│   ├── config.py                         Pydantic Settings class. Reads from .env.
│   │                                     Exports: ANTHROPIC_API_KEY, data provider
│   │                                     credentials, backtest defaults.
│   │
│   │
│   ├── api/                              ── HTTP ROUTES ─────────────────────────
│   │   ├── __init__.py
│   │   ├── strategy.py                   POST /run          → triggers full pipeline
│   │   │                                 POST /parse        → parse-only (debug)
│   │   ├── tearsheet.py                  GET  /tearsheet/{id} → fetch stored result
│   │   ├── history.py                    GET  /history       → past runs list
│   │   └── automator.py                  POST /automate      → deploy approved strategy
│   │
│   │
│   ├── agents/                           ══ AGENT LAYER ════════════════════════
│   │   │
│   │   ├── manager.py                    ★ MANAGER / ORCHESTRATOR AGENT
│   │   │                                 • Parses NL prompt via LLM (2 parallel calls:
│   │   │                                   strategy parse + expert type detection)
│   │   │                                 • Builds StrategySpec (Pydantic model)
│   │   │                                 • Selects and instantiates Expert Agent
│   │   │                                 • Fires Trader + Expert in asyncio.gather()
│   │   │                                 • Retries failed agents up to MAX_RETRIES
│   │   │                                 • Hands off to Verifier → Comparator
│   │   │                                 • Calls LLM to narrate tearsheet in English
│   │   │                                 • Triggers Automator if trader approves
│   │   │                                 Key classes: ManagerAgent, StrategySpec,
│   │   │                                   TradeCondition, StrategyType, Tearsheet
│   │   │
│   │   ├── trader_strategy.py            TRADER STRATEGY AGENT
│   │   │                                 • Receives StrategySpec from Manager
│   │   │                                 • Translates entry/exit conditions into
│   │   │                                   vectorised pandas signal series
│   │   │                                 • Calls engine.runner.BacktestRunner
│   │   │                                 • Returns AgentResult with equity curve,
│   │   │                                   trade log, and raw performance metrics
│   │   │
│   │   ├── verifier.py                   VERIFIER AGENT
│   │   │                                 • Receives both AgentResults + StrategySpec
│   │   │                                 • Checks: data shape, trade count > 0,
│   │   │                                   no NaN in equity curve, date range correct
│   │   │                                 • If check fails → returns error with which
│   │   │                                   agent needs to rerun and why
│   │   │                                 • If OK → passes both to Comparator
│   │   │                                 Returns: VerifierResult(ok, issues[])
│   │   │
│   │   ├── comparator.py                 COMPARATOR AGENT
│   │   │                                 • Aligns equity curves on same date index
│   │   │                                 • Adds SPY benchmark via data.loader
│   │   │                                 • Computes Sharpe, Sortino, max drawdown,
│   │   │                                   win rate, CAGR for all three series
│   │   │                                 • Builds comparison dict (trader/expert/bench)
│   │   │                                 • Returns raw Tearsheet (no narrative yet)
│   │   │
│   │   ├── automator.py                  AUTOMATOR AGENT
│   │   │                                 • Receives approved StrategySpec
│   │   │                                 • Serialises strategy to JSON config
│   │   │                                 • Registers with broker adapter (Alpaca paper)
│   │   │                                 • Starts live polling loop (or schedules cron)
│   │   │                                 • Flags SUCCESS or ERROR back to Manager
│   │   │
│   │   └── expert/                       ── EXPERT BENCHMARK AGENTS ─────────────
│   │       │
│   │       ├── base.py                   Abstract base: run(spec, dates, capital) → AgentResult
│   │       │                             All experts implement this interface.
│   │       │
│   │       ├── risk_analysis.py          RISK ANALYSIS AGENT
│   │       │                             Algorithms: Monte Carlo (GBM paths),
│   │       │                             GARCH(1,1) for vol estimation.
│   │       │                             Flow: fit GARCH on historical returns →
│   │       │                             use vol forecast to adjust position sizes →
│   │       │                             run 10k Monte Carlo paths → pick median path
│   │       │                             as equity curve → compute VaR, CVaR as extras
│   │       │
│   │       ├── derivatives_pricing.py    DERIVATIVES & PRICING AGENT
│   │       │                             Algorithms: Black-Scholes-Merton (BSM),
│   │       │                             Cox-Ross-Rubinstein Binomial Tree.
│   │       │                             Flow: detect if asset has options →
│   │       │                             price at-the-money calls/puts via BSM →
│   │       │                             compute Greeks (Delta, Gamma, Vega, Theta) →
│   │       │                             simulate delta-hedged P&L over backtest window
│   │       │
│   │       ├── portfolio_construction.py PORTFOLIO CONSTRUCTION AGENT
│   │       │                             Algorithms: Mean-Variance Optimisation (MVO),
│   │       │                             Black-Litterman.
│   │       │                             Flow: fetch correlated assets → compute
│   │       │                             covariance matrix → run MVO to find efficient
│   │       │                             frontier → apply BL views if asset = single stock →
│   │       │                             return rebalanced portfolio equity curve
│   │       │
│   │       ├── alpha_signal.py           ALPHA GENERATION & SIGNAL AGENT
│   │       │                             Algorithms: Kalman Filter (dynamic hedge ratio),
│   │       │                             Statistical Arbitrage / Pairs Trading.
│   │       │                             Flow: find cointegrated pair for asset →
│   │       │                             compute spread z-score with Kalman hedge ratio →
│   │       │                             enter/exit on z-score threshold → return
│   │       │                             market-neutral equity curve
│   │       │
│   │       ├── fixed_income.py           FIXED INCOME & RATES AGENT
│   │       │                             Algorithms: Duration & Convexity Analysis,
│   │       │                             Vasicek / CIR short rate models.
│   │       │                             Flow: if asset is bond ETF → compute DV01,
│   │       │                             modified duration, convexity → simulate
│   │       │                             Vasicek rate path → price bond portfolio
│   │       │                             along simulated rate path
│   │       │
│   │       └── microstructure.py         MARKET MICROSTRUCTURE AGENT
│   │                                     Algorithms: Hidden Markov Model (HMM),
│   │                                     VWAP/TWAP execution scheduling.
│   │                                     Flow: fit 2-state HMM on returns (bull/bear) →
│   │                                     trade only in bull regime → size orders using
│   │                                     VWAP schedule to minimise market impact →
│   │                                     return execution-adjusted equity curve
│   │
│   │
│   ├── engine/                           ══ BACKTEST ENGINE ════════════════════
│   │   │
│   │   ├── runner.py                     BacktestRunner(spec, data, friction)
│   │   │                                 Event loop: for each bar →
│   │   │                                   evaluate entry signals →
│   │   │                                   evaluate exit signals →
│   │   │                                   size order → apply friction →
│   │   │                                   update portfolio →
│   │   │                                   log trade
│   │   │                                 Returns: EquitySeries, TradeLog
│   │   │
│   │   ├── friction.py                   FrictionModel
│   │   │                                 • Commission: flat bps on notional
│   │   │                                 • Slippage: half-spread random draw
│   │   │                                 • Market impact: sqrt model for large orders
│   │   │
│   │   ├── portfolio.py                  Portfolio(capital)
│   │   │                                 Tracks: cash, positions, margin, P&L
│   │   │                                 Methods: buy(), sell(), mark_to_market()
│   │   │
│   │   └── event.py                      Data classes: Bar, Order, Fill, Position
│   │                                     Keeps engine logic decoupled from data types
│   │
│   │
│   ├── algorithms/                       ══ QUANTITATIVE ALGORITHMS ═══════════
│   │   │                                 Pure math — no agent logic here.
│   │   │                                 All functions take numpy/pandas, return same.
│   │   │
│   │   ├── risk/
│   │   │   ├── monte_carlo.py            simulate_gbm_paths(S0, mu, sigma, T, N)
│   │   │   │                             compute_var(paths, confidence)
│   │   │   │                             compute_cvar(paths, confidence)
│   │   │   │
│   │   │   └── garch.py                  fit_garch(returns) → GARCHResult
│   │   │                                 forecast_volatility(result, horizon)
│   │   │                                 (wraps arch.arch_model)
│   │   │
│   │   ├── pricing/
│   │   │   ├── black_scholes.py          bsm_price(S,K,T,r,sigma,option_type)
│   │   │   │                             bsm_greeks(S,K,T,r,sigma) → Greeks dataclass
│   │   │   │
│   │   │   └── binomial_tree.py          crr_price(S,K,T,r,sigma,N,option_type,style)
│   │   │                                 style: "european" | "american"
│   │   │
│   │   ├── portfolio/
│   │   │   ├── mean_variance.py          efficient_frontier(returns, n_points)
│   │   │   │                             max_sharpe_weights(returns, rf_rate)
│   │   │   │                             min_variance_weights(returns)
│   │   │   │
│   │   │   └── black_litterman.py        bl_posterior(market_weights, sigma,
│   │   │                                   views, view_confidences, tau)
│   │   │                                 Returns: posterior mean returns, posterior cov
│   │   │
│   │   ├── alpha/
│   │   │   ├── kalman_filter.py          KalmanHedgeRatio — dynamic OLS via Kalman
│   │   │   │                             update(price_x, price_y) → hedge_ratio
│   │   │   │
│   │   │   └── pairs_trading.py          find_cointegrated_pair(tickers, data)
│   │   │                                 compute_spread(series_x, series_y, hedge)
│   │   │                                 zscore(spread, window) → signal series
│   │   │
│   │   ├── fixed_income/
│   │   │   ├── duration_convexity.py     modified_duration(cashflows, ytm)
│   │   │   │                             convexity(cashflows, ytm)
│   │   │   │                             dv01(cashflows, ytm)
│   │   │   │
│   │   │   └── short_rate_models.py      vasicek_path(r0, a, b, sigma, T, N)
│   │   │                                 cir_path(r0, a, b, sigma, T, N)
│   │   │                                 bond_price_vasicek(r, a, b, sigma, T)
│   │   │
│   │   └── microstructure/
│   │       ├── hmm.py                    fit_hmm(returns, n_states) → HMMModel
│   │       │                             predict_regime(model, returns) → state series
│   │       │                             (wraps hmmlearn.GaussianHMM)
│   │       │
│   │       └── vwap_twap.py              vwap_schedule(total_qty, volume_profile)
│   │                                     twap_schedule(total_qty, T, n_slices)
│   │                                     Returns: list of (time, qty) tuples
│   │
│   │
│   ├── signals/                          ══ TECHNICAL INDICATOR LIBRARY ═══════
│   │   ├── moving_averages.py            sma(series, window), ema(series, span)
│   │   │                                 crossover_signal(fast, slow) → {+1, 0, -1}
│   │   │
│   │   ├── oscillators.py                rsi(series, period), macd(series, f, s, sig)
│   │   │                                 stochastic(high, low, close, k, d)
│   │   │
│   │   ├── volatility.py                 atr(high, low, close, period)
│   │   │                                 bollinger_bands(series, window, n_std)
│   │   │
│   │   └── volume.py                     vwap(high, low, close, volume)
│   │                                     obv(close, volume)
│   │
│   │
│   ├── data/                             ══ DATA LAYER ═════════════════════════
│   │   ├── loader.py                     load_ohlcv(ticker, start, end) → pd.DataFrame
│   │   │                                 Auto-routes to correct provider. Caches result.
│   │   │
│   │   ├── providers/
│   │   │   ├── yahoo.py                  Uses yfinance. Default provider.
│   │   │   ├── alpaca.py                 Uses alpaca-trade-api. For live/paper.
│   │   │   └── csv.py                    Reads local OHLCV CSV files.
│   │   │
│   │   └── cache.py                      Disk cache (parquet). TTL = 24h.
│   │                                     Key: f"{ticker}_{start}_{end}"
│   │
│   │
│   ├── nlp/                              ══ NLP / PARSING LAYER ════════════════
│   │   ├── parser.py                     StrategyParser.parse(prompt) → StrategySpec
│   │   │                                 Called by ManagerAgent._parse_strategy()
│   │   │
│   │   ├── schema.py                     Pydantic models:
│   │   │                                 StrategySpec, TradeCondition, AgentResult,
│   │   │                                 Tearsheet, RunRequest, VerifierResult
│   │   │
│   │   └── prompts/
│   │       ├── parse_strategy.txt        System prompt for NL → StrategySpec JSON
│   │       ├── select_expert.txt         System prompt for strategy type detection
│   │       └── narrate_tearsheet.txt     System prompt for plain-English explanation
│   │
│   │
│   ├── tearsheet/                        ══ PERFORMANCE METRICS ════════════════
│   │   ├── metrics.py                    sharpe(returns, rf), sortino(returns, rf)
│   │   │                                 max_drawdown(equity_curve)
│   │   │                                 cagr(equity_curve, years)
│   │   │                                 win_rate(trade_log)
│   │   │
│   │   ├── builder.py                    Assembles Tearsheet from raw AgentResults
│   │   │                                 Adds benchmark (SPY) for comparison
│   │   │
│   │   └── serialiser.py                 Converts Tearsheet → JSON-serialisable dict
│   │                                     Handles: datetime→str, float precision
│   │
│   │
│   └── utils/
│       ├── logger.py                     Structured JSON logging. Run ID tagging.
│       ├── dates.py                      Trading calendar, date validation helpers
│       └── validators.py                 Ticker validation, date range sanity checks
│
│
├── frontend/                             ══ FRONTEND (React + Vite + TypeScript) ══
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                       Route: / → StrategyLab, /history → History
│       ├── store/
│       │   ├── strategyStore.ts          Zustand: prompt, params, runStatus
│       │   └── tearsheetStore.ts         Zustand: tearsheet data, selected run
│       │
│       ├── api/
│       │   ├── client.ts                 Axios instance with base URL + error handling
│       │   ├── strategy.ts               runStrategy(req) → Tearsheet
│       │   └── automator.ts             automate(strategyId, useExpert) → status
│       │
│       ├── hooks/
│       │   ├── useRun.ts                 Manages run lifecycle + polling
│       │   ├── useTearsheet.ts           Fetches + caches tearsheet by ID
│       │   └── useAgentStream.ts         SSE hook for live agent status updates
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   └── PageWrapper.tsx
│       │   │
│       │   ├── input/
│       │   │   ├── StrategyTextarea.tsx  Dark textarea, placeholder examples, char count
│       │   │   ├── AssetSelector.tsx     Searchable ticker dropdown (react-select)
│       │   │   ├── DateRangePicker.tsx   From / To date inputs with calendar
│       │   │   ├── CapitalConfig.tsx     Capital input + commission/slippage sliders
│       │   │   └── RunButton.tsx         Animated CTA, disabled during run
│       │   │
│       │   ├── pipeline/
│       │   │   ├── AgentPipeline.tsx     Vertical list of agent status rows
│       │   │   └── AgentStatusRow.tsx    Name + status dot + live text stream
│       │   │
│       │   ├── tearsheet/
│       │   │   ├── TearsheetLayout.tsx   Grid container for all tearsheet panels
│       │   │   ├── EquityCurve.tsx       Recharts LineChart: 3 series + drawdown shade
│       │   │   ├── MetricsGrid.tsx       5 KPI cards (Sharpe, DD, WR, CAGR, Sortino)
│       │   │   ├── KPICard.tsx           Single metric card with delta badge
│       │   │   ├── ComparisonTable.tsx   Trader / Expert / Benchmark table
│       │   │   └── IrisSaysPanel.tsx     Streamed LLM narrative + automate buttons
│       │   │
│       │   └── modals/
│       │       └── AutomateModal.tsx     Confirmation + deployment progress
│       │
│       ├── pages/
│       │   ├── StrategyLab.tsx           Main page — input + pipeline + tearsheet
│       │   └── History.tsx               Past runs list with re-run option
│       │
│       └── styles/
│           ├── globals.css               CSS variables (design tokens)
│           └── fonts.css                 DM Mono + IBM Plex Sans imports
│
│
├── tests/                                ══ TEST SUITE ═════════════════════════
│   ├── conftest.py                       Fixtures: mock OHLCV data, mock LLM responses,
│   │                                     test StrategySpec presets
│   │
│   ├── agents/
│   │   ├── test_manager.py               parse_strategy(), expert selection,
│   │   │                                 full pipeline mock run
│   │   ├── test_verifier.py              Pass/fail scenarios, retry logic
│   │   └── test_comparator.py            Metric computation accuracy
│   │
│   ├── algorithms/
│   │   ├── test_monte_carlo.py           Path shape, VaR bounds, seed reproducibility
│   │   ├── test_garch.py                 Fit convergence, forecast shape
│   │   ├── test_black_scholes.py         Put-call parity, boundary conditions
│   │   ├── test_pairs_trading.py         Cointegration detection, spread z-score
│   │   └── test_kalman_filter.py         Convergence of hedge ratio estimate
│   │
│   ├── engine/
│   │   ├── test_runner.py                Buy-and-hold baseline, signal alignment
│   │   └── test_friction.py              Commission math, slippage bounds
│   │
│   └── nlp/
│       └── test_parser.py                MA crossover parse, RSI exit parse,
│                                         unknown strategy fallback
│
│
├── scripts/
│   ├── seed_cache.py                     Pre-downloads SPY, AAPL, MSFT OHLCV for dev
│   ├── run_example.py                    CLI end-to-end test, prints tearsheet to stdout
│   └── benchmark_algos.py                Times all algorithm implementations
│
│
└── docs/
    ├── architecture.md                   Agent interaction sequence diagrams
    ├── algorithms.md                     Math reference: all formulas with notation
    ├── api.md                            REST API: request/response schemas
    └── adding_an_expert_agent.md         Step-by-step guide to extend the platform
```

---

## Data Flow Summary

```
User Prompt (NL)
      │
      ▼
ManagerAgent._parse_strategy()          [2 LLM calls, parallel]
      │
      ├── StrategySpec (Pydantic)
      └── StrategyType → Expert selection
            │
            ▼
asyncio.gather(
  TraderStrategyAgent.run(spec),        [executes trader's exact strategy]
  ExpertAgent.run(spec)                 [runs domain algorithm as benchmark]
)
      │
      ▼
VerifierAgent.verify(trader, expert, spec)
      │
      ▼
ComparatorAgent.compare(trader, expert) → raw Tearsheet
      │
      ▼
ManagerAgent._narrate(tearsheet)        [1 LLM call → plain-English summary]
      │
      ▼
Tearsheet (with narrative) → API → Frontend
      │
      ▼ (if trader approves)
AutomatorAgent.deploy(spec)             [live/paper trading registration]
```

---

## Key Engineering Decisions

| Decision | Rationale |
|---|---|
| `asyncio.gather()` for dual simulation | Trader + Expert run in parallel — cuts wall time by ~50% |
| Agents and algorithms separated | Algorithms are pure math, fully unit-testable without LLM mocks |
| LLM prompts as `.txt` files | Non-engineers can iterate prompts without touching Python |
| Pydantic throughout | Runtime validation at every boundary; auto-generates API docs |
| Event-driven backtest engine | Matches live trading architecture — low-friction path to deployment |
| Disk-cached OHLCV data | Dev loop is fast; avoids hitting provider rate limits repeatedly |

---

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Data (at least one)
ALPACA_API_KEY=...
ALPACA_SECRET_KEY=...

# Backtest defaults (all optional)
BACKTEST_DEFAULT_CAPITAL=100000
BACKTEST_COMMISSION_PCT=0.001
BACKTEST_SLIPPAGE_PCT=0.0005
BACKTEST_DEFAULT_ASSET=SPY

# Server
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173
```

---

## Dependencies

### Python
```
anthropic          # LLM — Manager Agent NLP
fastapi            # REST API
uvicorn            # ASGI server
pydantic           # Data validation throughout
pandas             # Time series manipulation
numpy              # Numerical computation
yfinance           # Historical OHLCV data (default provider)
alpaca-trade-api   # Broker integration (Automator Agent)
arch               # GARCH model (Risk Agent)
hmmlearn           # Hidden Markov Model (Microstructure Agent)
scipy              # Optimisation (MVO), stats (BSM)
pykalman           # Kalman Filter (Alpha Agent)
statsmodels        # Cointegration tests (Pairs Trading)
```

### Frontend
```
react + typescript    # UI framework
vite                  # Build tool
tailwindcss           # Styling
recharts              # Charts (equity curve)
zustand               # State management
axios                 # HTTP client
framer-motion         # Animations
lucide-react          # Icons
react-query           # Server state + caching
react-select          # Asset search dropdown
```
