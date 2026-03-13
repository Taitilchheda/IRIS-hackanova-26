## Unused / Partially Used Backend Components in IRIS

This document captures backend capabilities that are **implemented in the codebase** but are **not currently wired into the primary API / frontend flow** (User → Manager Agent → Expert Agents → Verifier → Comparator → Tearsheets → Automator).

The goal is to highlight future extension points and areas where we can either streamline or expose more power to the UI.

---

### 1. Agents Implemented but Not Uniquely Exposed

From the architecture perspective, all core agents in the desired IRIS pipeline **are implemented and used**:

- **ManagerAgent** — orchestrator used by `/api/run` and `/api/backtest`.
- **TraderStrategyAgent** — invoked by `ManagerAgent.run`.
- **Expert Agents** (all wired via `EXPERT_MAP` in `ManagerAgent`):
  - `RiskAnalysisAgent`
  - `AlphaSignalAgent`
  - `PortfolioAgent`
  - `DerivativesPricingAgent`
  - `FixedIncomeAgent`
  - `MicrostructureAgent`
- **VerifierAgent** — used by `ManagerAgent` before comparison.
- **ComparatorAgent** — used by `ManagerAgent` to build `Tearsheet`.
- **AutomatorAgent** — wrapped by the `/api/automate` endpoints.

There are **no fully unused agents**; however, some agent-specific metadata is not surfaced to the frontend:

- Per-agent `metrics` dictionaries (e.g. GARCH/Monte Carlo stats, regime stats, options Greeks approximations) are populated in each `AgentResult` but only partially used in the UI.
- Agent timing information (`elapsed_seconds`) is populated but not yet visualised in the agent pipeline UI.

---

### 2. Algorithms Implemented but Not Triggered by the Main Pipeline

Several quantitative algorithm modules under `app/algorithms/` are **implemented and tested** but not currently invoked by the live agents (they are referenced primarily from docs, `__init__.py`, and benchmarking/tests):

- **Portfolio / Black-Litterman**
  - File: `app/algorithms/portfolio/black_litterman.py`
  - Not imported in any agent; `PortfolioAgent` uses an internal `_max_sharpe_weights` implementation instead of this module.

- **Risk / Monte Carlo + GARCH (standalone)**
  - Files: `app/algorithms/risk/monte_carlo.py`, `app/algorithms/risk/garch.py`
  - The `RiskAnalysisAgent` reimplements a simplified GARCH + GBM flow inline and does **not** call these helpers.

- **Pricing**
  - Files: `app/algorithms/pricing/black_scholes.py`, `app/algorithms/pricing/binomial_tree.py`
  - `DerivativesPricingAgent` embeds its own BSM-style pricing/delta helpers and does not import these modules.

- **Fixed Income**
  - Files: `app/algorithms/fixed_income/duration_convexity.py`, `app/algorithms/fixed_income/short_rate_models.py`
  - `FixedIncomeAgent` uses an inline Vasicek path generator and bond pricer instead of these modules.

- **Alpha / Pairs Trading + Kalman Filter**
  - Files: `app/algorithms/alpha/kalman_filter.py`, `app/algorithms/alpha/pairs_trading.py`
  - `AlphaSignalAgent` implements a simplified Kalman and spread/z-score logic internally and does not import these modules.

- **Microstructure**
  - Files: `app/algorithms/microstructure/hmm.py`, `app/algorithms/microstructure/vwap_twap.py`
  - `MicrostructureAgent` uses a lightweight internal HMM-style routine and inline VWAP sizing instead of these helpers.

These modules are validated via tests and `scripts/benchmark.py`, but **they are not in the live agent execution path**. They are candidates for:

- Refactoring agents to call into these libraries (for code reuse and clearer separation), or
- Removing/reclassifying as “quant library” if the inline versions remain the canonical implementations.

---

### 3. Models / Pipelines the Frontend Never Calls

The FastAPI layer exposes multiple logical pipelines; the current frontend only uses a subset:

- **Used by the frontend**
  - `POST /api/run`
    - Defined in `app/api/strategy.py` as `run_strategy`.
    - Triggers the full Manager → Trader & Expert → Verifier → Comparator → Tearsheets → Narration pipeline.
  - `GET /api/tearsheet/{run_id}`
    - Used by the client to retrieve a full tearsheet by ID.
  - `POST /api/automate/{run_id}`
    - Exposed via `app/api/automator.py` and consumed by the new UI automation flow.

- **Implemented but not used by the current UI**
  - `POST /api/backtest`
    - File: `app/api/backtest.py`
    - Semantically identical to `/api/run` but namespaced under `/backtest`. No references from the frontend.
  - `POST /api/parse`
    - File: `app/api/strategy.py`
    - Debug endpoint that returns only the parsed `StrategySpec` without running the backtest.
  - `GET /api/history`
    - File: `app/api/strategy.py`
    - Returns a lightweight view over `_tearsheets` (in-memory history of runs). Not yet surfaced in the React app.
  - `GET /api/tearsheets`
    - File: `app/api/tearsheet.py`
    - Returns a summary list of past tearsheets. No current UI binding (history page is not implemented in this version).
  - `POST /api/automate/strategy`
    - File: `app/api/automator.py`
    - Allows deployment from a raw `StrategySpec` JSON payload, bypassing `/api/run`. Not wired to the UI.

---

### 4. Serialization & Builder Utilities Not Used by HTTP APIs

Two utilities under `app/tearsheet/` are underutilised by the HTTP layer:

- **`app/tearsheet/builder.py`**
  - Provides `build_tearsheet(...)` which assembles a `Tearsheet` from `AgentResult`s and optional benchmark.
  - Currently only referenced in docs; the live pipeline uses `ComparatorAgent.compare(...)` to construct the `Tearsheet` directly.
  - Used conceptually, but **not imported anywhere in the runtime code**.

- **`app/tearsheet/serialiser.py`**
  - Functions: `tearsheet_to_json`, `tearsheet_from_json`, `tearsheet_to_dict`, `summary_dict`.
  - Used by `scripts/run_example.py` and potentially CLI tooling, but not by any FastAPI endpoint.
  - The REST layer instead relies on Pydantic’s `.model_dump()` and FastAPI’s automatic JSON serialisation.

These modules are excellent candidates for:

- Centralising `Tearsheet` construction (having `ComparatorAgent` delegate to `build_tearsheet`), and
- Standardising how summaries are returned for history endpoints.

---

### 5. Data Pipelines Not Connected to the UI

The **data layer** is fully implemented but partially invisible to the current frontend:

- **Data Providers**
  - `app/data/providers/yahoo.py` — default OHLCV source via `yfinance`.
  - `app/data/providers/alpaca.py` — live/paper trading via Alpaca.
  - `app/data/providers/csv.py` — local CSV-based provider.
  - `app/data/cache.py` — disk-based caching (parquet) with TTL.
  - `app/data/loader.py` — routing entry point used extensively by agents and backtest engine.

From the frontend’s perspective:

- Users **cannot select or see** which data provider is in use.
- There is **no UI to inspect cached symbols**, refresh cache, or choose between live vs historical providers.
- Alpaca live trading integration is only reachable indirectly via `AutomatorAgent` and the `/api/automate` endpoints; there is no dedicated “live data / broker status” surface in the UI.

These gaps are **by design for now**, but worth noting as future enhancements for transparency and control.

---

### 6. Suggested Follow-Ups (Non-Breaking)

Without modifying core algorithms, the following improvements would increase cohesion:

1. **Refactor expert agents to call quant libraries**
   - Replace inline math in expert agents with calls into `app/algorithms/*` modules, keeping behaviour equivalent but improving reuse and test alignment.

2. **Adopt `tearsheet.builder` and `tearsheet.serialiser` in the HTTP path**
   - Have `ComparatorAgent` delegate to `build_tearsheet` for consistency.
   - Use `summary_dict` for `/api/history` and `/api/tearsheets` responses to ensure a single, canonical summary format.

3. **Expose history and parse-only flows in the frontend**
   - Add a “History” view backed by `GET /api/tearsheets` / `GET /api/history`.
   - Add a “Preview / Validate Strategy” action that calls `POST /api/parse` without running a full backtest.

4. **Surface agent metrics and data-provider information**
   - Show agent-level `metrics` (e.g. VaR/CVaR, regime stats) in the analysis panels instead of placeholder numbers.
   - Expose current data provider and cache status in a small “Data Source” panel.

