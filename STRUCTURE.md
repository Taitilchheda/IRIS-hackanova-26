# IRIS — Project File Structure

Annotated directory tree for the full IRIS codebase.

```
iris/
│
├── README.md                          # Project overview (this repo's front page)
├── STRUCTURE.md                       # This file
├── .env.example                       # Environment variable template
├── .gitignore
├── docker-compose.yml                 # Full-stack local orchestration
├── requirements.txt                   # Python dependencies
├── pyproject.toml                     # Project metadata and tool config
│
├── app/                               # ── BACKEND (FastAPI) ──────────────────
│   ├── main.py                        # FastAPI entrypoint, router registration
│   ├── config.py                      # Settings (loaded from .env)
│   │
│   ├── api/                           # HTTP route handlers
│   │   ├── __init__.py
│   │   ├── strategy.py                # POST /strategy — accepts NL prompt
│   │   ├── backtest.py                # POST /backtest — triggers backtest run
│   │   ├── tearsheet.py               # GET  /tearsheet/{run_id}
│   │   └── automator.py               # POST /automate — deploy approved strategy
│   │
│   ├── agents/                        # ── AGENT LAYER ─────────────────────────
│   │   ├── __init__.py
│   │   ├── manager.py                 # Orchestrator — parses NL, allocates agents,
│   │   │                              #   routes results back to trader
│   │   │
│   │   ├── trader_strategy.py         # Executes exactly the trader's strategy
│   │   ├── verifier.py                # Validates both outputs vs requirements
│   │   ├── comparator.py              # Side-by-side tearsheet generation
│   │   ├── automator.py               # Live strategy deployment handler
│   │   │
│   │   └── expert/                    # Expert benchmark agents (one per domain)
│   │       ├── __init__.py
│   │       ├── base.py                # Abstract base class for all expert agents
│   │       ├── risk_analysis.py       # Monte Carlo + GARCH
│   │       ├── derivatives_pricing.py # Black-Scholes + Binomial Tree
│   │       ├── portfolio_construction.py  # Mean-Variance + Black-Litterman
│   │       ├── alpha_signal.py        # Kalman Filter + Pairs Trading / Stat Arb
│   │       ├── fixed_income.py        # Duration/Convexity + Short Rate Models
│   │       └── microstructure.py      # HMM + VWAP/TWAP
│   │
│   ├── engine/                        # ── BACKTEST ENGINE ─────────────────────
│   │   ├── __init__.py
│   │   ├── runner.py                  # Core simulation loop
│   │   ├── friction.py                # Commission, slippage, bid-ask spread models
│   │   ├── portfolio.py               # Position tracking, P&L, cash management
│   │   └── event.py                   # Event-driven order/fill abstractions
│   │
│   ├── algorithms/                    # ── QUANTITATIVE ALGORITHMS ─────────────
│   │   ├── __init__.py
│   │   │
│   │   ├── risk/
│   │   │   ├── monte_carlo.py         # GBM path simulation, VaR, CVaR
│   │   │   └── garch.py               # GARCH(1,1), EGARCH volatility models
│   │   │
│   │   ├── pricing/
│   │   │   ├── black_scholes.py       # BSM closed-form, Greeks
│   │   │   └── binomial_tree.py       # CRR binomial tree (American/European)
│   │   │
│   │   ├── portfolio/
│   │   │   ├── mean_variance.py       # Efficient frontier, Sharpe maximisation
│   │   │   └── black_litterman.py     # BL equilibrium + view blending
│   │   │
│   │   ├── alpha/
│   │   │   ├── kalman_filter.py       # Dynamic hedge ratio, signal extraction
│   │   │   └── pairs_trading.py       # Cointegration (EG/Johansen), spread z-score
│   │   │
│   │   ├── fixed_income/
│   │   │   ├── duration_convexity.py  # Modified duration, DV01, convexity
│   │   │   └── short_rate_models.py   # Vasicek, CIR model implementations
│   │   │
│   │   └── microstructure/
│   │       ├── hmm.py                 # Hidden Markov Model for regime detection
│   │       └── vwap_twap.py           # VWAP/TWAP execution scheduling
│   │
│   ├── signals/                       # ── TECHNICAL SIGNAL LIBRARY ────────────
│   │   ├── __init__.py
│   │   ├── moving_averages.py         # SMA, EMA, DEMA, TEMA
│   │   ├── oscillators.py             # RSI, MACD, Stochastic, CCI
│   │   ├── volatility.py              # ATR, Bollinger Bands, Keltner
│   │   └── volume.py                  # OBV, VWAP, Accumulation/Distribution
│   │
│   ├── data/                          # ── DATA LAYER ──────────────────────────
│   │   ├── __init__.py
│   │   ├── loader.py                  # Unified OHLCV loader (dispatches to providers)
│   │   ├── providers/
│   │   │   ├── yahoo.py               # yfinance wrapper
│   │   │   ├── alpaca.py              # Alpaca Markets historical data
│   │   │   └── csv.py                 # Local CSV / custom data ingestion
│   │   └── cache.py                   # Local disk cache to avoid repeat API calls
│   │
│   ├── nlp/                           # ── NLP / STRATEGY PARSING ──────────────
│   │   ├── __init__.py
│   │   ├── parser.py                  # LLM prompt → structured StrategySpec
│   │   ├── schema.py                  # Pydantic models: StrategySpec, Rule, Condition
│   │   └── prompts/
│   │       ├── parse_strategy.txt     # System prompt for strategy extraction
│   │       └── explain_tearsheet.txt  # System prompt for plain-English results
│   │
│   ├── tearsheet/                     # ── PERFORMANCE REPORTING ───────────────
│   │   ├── __init__.py
│   │   ├── metrics.py                 # Sharpe, Sortino, max drawdown, win rate, CAGR
│   │   ├── builder.py                 # Assembles full TearsheetResult object
│   │   └── serialiser.py             # JSON serialisation for API response
│   │
│   └── utils/                         # ── SHARED UTILITIES ────────────────────
│       ├── __init__.py
│       ├── logger.py                  # Structured logging setup
│       ├── dates.py                   # Trading calendar helpers
│       └── validators.py              # Input sanitisation
│
├── frontend/                          # ── FRONTEND (React + Vite) ─────────────
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── StrategyInput.tsx       # Plain-English strategy text input
│       │   ├── RunStatus.tsx           # Live agent progress indicator
│       │   ├── Tearsheet/
│       │   │   ├── index.tsx           # Tearsheet container
│       │   │   ├── EquityCurve.tsx     # Recharts line chart
│       │   │   ├── MetricCards.tsx     # Sharpe, drawdown, win rate cards
│       │   │   └── ComparisonTable.tsx # Trader vs Expert side-by-side
│       │   └── AutomateModal.tsx       # "Automate this strategy?" confirmation
│       │
│       ├── hooks/
│       │   ├── useStrategy.ts          # Strategy submission + polling
│       │   └── useTearsheet.ts         # Tearsheet fetch and state
│       │
│       └── api/
│           └── client.ts              # Typed API client (axios / fetch)
│
├── tests/                             # ── TESTS ───────────────────────────────
│   ├── conftest.py                    # Pytest fixtures (mock data, test clients)
│   │
│   ├── agents/
│   │   ├── test_manager.py
│   │   ├── test_verifier.py
│   │   └── test_comparator.py
│   │
│   ├── algorithms/
│   │   ├── test_monte_carlo.py
│   │   ├── test_garch.py
│   │   ├── test_black_scholes.py
│   │   ├── test_pairs_trading.py
│   │   └── test_kalman_filter.py
│   │
│   ├── engine/
│   │   ├── test_runner.py
│   │   └── test_friction.py
│   │
│   └── nlp/
│       └── test_parser.py             # Prompt → StrategySpec parsing tests
│
├── scripts/                           # ── DEV SCRIPTS ─────────────────────────
│   ├── seed_cache.py                  # Pre-download historical data for dev
│   ├── run_example.py                 # End-to-end example run (no UI)
│   └── benchmark.py                   # Algorithm performance benchmarks
│
└── docs/                              # ── DOCUMENTATION ───────────────────────
    ├── architecture.md                # Detailed agent interaction diagrams
    ├── algorithms.md                  # Algorithm reference with formulas
    ├── api.md                         # REST API reference
    └── adding_an_agent.md             # Guide for extending the expert agent suite
```

---

## Key Design Decisions

### Why separate `agents/` and `algorithms/`?

Agents contain orchestration logic — how to call things, what to do with results, how to verify and compare. Algorithms contain pure mathematical implementations with no agent awareness. This separation means algorithms can be unit-tested independently and reused across multiple agents.

### Why `nlp/prompts/` as flat text files?

Prompt templates evolve frequently during development. Keeping them as `.txt` files (rather than hardcoded strings) makes them easy to version, review in PRs, and hand off to non-engineers for iteration.

### Why an event-driven backtest engine?

The `engine/event.py` abstraction (Order → Fill → Portfolio update) matches how live trading systems work. This means strategies developed and tested in IRIS can be adapted for live deployment with minimal friction model changes.

---

## Environment Variables

Copy `.env.example` to `.env` and populate:

```env
# LLM
ANTHROPIC_API_KEY=sk-ant-...

# Data providers (at least one required)
ALPACA_API_KEY=...
ALPACA_SECRET_KEY=...

# Optional overrides
BACKTEST_DEFAULT_CAPITAL=100000
BACKTEST_COMMISSION_PCT=0.001
BACKTEST_SLIPPAGE_PCT=0.0005
LOG_LEVEL=INFO
```
