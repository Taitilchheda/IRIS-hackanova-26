# IRIS — UI Design Specification

## Design Language

**Aesthetic**: Dark, terminal-inspired financial interface. Think Bloomberg meets modern AI.  
**Theme**: Deep navy/charcoal backgrounds, electric teal accents, monospace data readouts.  
**Principle**: Every pixel earns its place. Data-dense but never cluttered.

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#080C14` | Page background |
| `--bg-surface` | `#0F1621` | Cards, panels |
| `--bg-elevated` | `#1A2235` | Inputs, hover states |
| `--accent-teal` | `#00D4AA` | Primary CTA, active states, highlights |
| `--accent-amber` | `#F5A623` | Warnings, drawdown indicators |
| `--accent-red` | `#FF4D6A` | Losses, errors, negative P&L |
| `--accent-green` | `#22D47E` | Gains, positive metrics |
| `--text-primary` | `#E8EDF5` | Headings, primary content |
| `--text-secondary` | `#6B7A99` | Labels, secondary text |
| `--border` | `#1E2D45` | Card borders, dividers |

---

## Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Display / Logo | `DM Mono` | 28px | 500 |
| Section Headings | `DM Mono` | 16px | 500 |
| Body / Labels | `IBM Plex Sans` | 14px | 400 |
| Data Readouts | `DM Mono` | 13–22px | 400–500 |
| Code / Signals | `DM Mono` | 12px | 400 |

---

## Frontend Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | **React 18** + JavaScript | Component model, type safety |
| Build | **Vite** | Fast HMR, lean bundle |
| Styling | **Tailwind CSS** + CSS Variables | Utility-first + design token system |
| Charts | **Recharts** | Composable, React-native charting |
| State | **Zustand** | Lightweight, no boilerplate |
| API | **Axios** + React Query | Caching, loading/error states |
| Animation | **Framer Motion** | Agent progress animations |
| Icons | **Lucide React** | Consistent, tree-shakeable |
| Fonts | Google Fonts — DM Mono, IBM Plex Sans | |

---

## Application Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                         │
│  [ IRIS ]    Strategy Lab    History    Settings        [●Live] │
└─────────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  STRATEGY INPUT PANEL                                    │   │
│  │                                                          │   │
│  │  > Describe your trading strategy in plain English...    │   │
│  │                                                          │   │
│  │  [Asset: AAPL ▼]  [From: 2020-01-01]  [To: 2024-12-31]   │   │
│  │  [Capital: $100,000]  [Commission: 0.1%]                 │   │
│  │                                         [ RUN IRIS ▶ ]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AGENT PIPELINE STATUS                                   │   │
│  │                                                          │   │
│  │  [●] Manager       parsing strategy...       ✓ done      │   │
│  │  [●] Trader Agent  running simulation...     ◌ running   │   │
│  │  [○] Expert Agent  (Risk Analysis)           ── waiting  │   │
│  │  [○] Verifier      ──                        ── waiting  │   │
│  │  [○] Comparator    ──                        ── waiting  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐ │
│  │  EQUITY CURVE               │  │  PERFORMANCE METRICS      │ │
│  │                             │  │                           │ │
│  │  $180k ─────╮               │  │  Sharpe Ratio   1.84      │ │
│  │  $140k      ╰──╮            │  │  Max Drawdown  -12.3%     │ │
│  │  $100k ─────────────────    │  │  Win Rate       61.4%     │ │
│  │  [Trader] [Expert] [SPY]    │  │  CAGR           18.2%     │ │
│  │                             │  │  Sortino        2.31      │ │
│  └─────────────────────────────┘  └───────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TRADER vs EXPERT COMPARISON                             │   │
│  │                                                          │   │
│  │           Your Strategy    Expert (Risk)    Benchmark    │   │
│  │  Return   +18.2%           +22.7%           +11.4%       │   │
│  │  Sharpe   1.84             2.21             0.92         │   │
│  │  Drawdown -12.3%           -8.1%            -18.7%       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IRIS SAYS                                               │   │
│  │                                                          │   │
│  │  "Your MA crossover strategy returned 18.2% annually     │   │
│  │   with a Sharpe of 1.84. The expert Risk Analysis agent  │   │
│  │   outperformed by 4.5pp using GARCH-adjusted position    │   │
│  │   sizing. Would you like to automate either strategy?"   │   │
│  │                                                          │   │
│  │           [ AUTOMATE MY STRATEGY ]  [ AUTOMATE EXPERT ]  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen Breakdown

### 1. Strategy Input Panel
- Large dark textarea with blinking cursor, placeholder text showing example strategies
- Asset selector (searchable dropdown — ticker symbols)
- Date range pickers (from / to)
- Capital input + commission/slippage sliders
- "RUN IRIS" CTA button — teal, full-width on mobile

### 2. Agent Pipeline Status
- Vertical list of agents with real-time status dots
- Three states: `waiting` (hollow), `running` (pulsing teal dot), `done` (solid green ✓)
- Animated text stream showing what each agent is doing ("parsing rules…", "running 10,000 paths…")
- Expandable detail row per agent showing intermediate output

### 3. Equity Curve Chart
- Line chart: three overlapping series — Trader Strategy (teal), Expert Strategy (amber), Benchmark SPY (gray)
- X-axis: dates, Y-axis: portfolio value ($)
- Hover tooltip: date, all three values, daily return
- Drawdown shaded region below the curve in translucent red
- Toggle buttons to show/hide each series

### 4. Performance Metrics Cards
- 5 KPI cards in a grid: Sharpe, Max Drawdown, Win Rate, CAGR, Sortino
- Colour-coded values (green = good, red = bad, amber = neutral)
- Comparison delta badge (e.g., "+0.37 vs Expert")

### 5. Trader vs Expert Comparison Table
- Side-by-side table: Your Strategy | Expert Agent | SPY Benchmark
- Rows: Total Return, Sharpe, Sortino, Max Drawdown, Win Rate, Trade Count, Avg Hold
- Winning column highlighted with teal left border

### 6. IRIS Says Panel (LLM Narrative)
- Dark card with monospace font
- Streamed plain-English explanation of results from the Manager Agent
- Two CTA buttons: Automate My Strategy / Automate Expert
- On click → confirmation modal → Automator Agent triggered

---

## Component Tree

```
<App>
 ├── <Navbar />
 ├── <StrategyInputPanel>
 │    ├── <StrategyTextarea />
 │    ├── <AssetSelector />
 │    ├── <DateRangePicker />
 │    ├── <CapitalConfig />
 │    └── <RunButton />
 ├── <AgentPipeline>
 │    └── <AgentStatusRow /> × 5
 ├── <TearsheetLayout>
 │    ├── <EquityCurve />          (Recharts LineChart)
 │    ├── <MetricsGrid>
 │    │    └── <KPICard /> × 5
 │    ├── <ComparisonTable />
 │    └── <IrisSaysPanel>
 │         ├── <StreamedNarrative />
 │         └── <AutomateButtons />
 └── <AutomateModal />
```

---

## Responsive Behaviour

| Breakpoint | Layout |
|---|---|
| Desktop (≥1280px) | Two-column tearsheet: chart left, metrics right |
| Tablet (768–1279px) | Single column, full-width chart |
| Mobile (<768px) | Stacked, metrics collapse to 2×2 grid |

---

## Key Interaction States

| State | Behaviour |
|---|---|
| Idle | Input panel prominent, no tearsheet visible |
| Running | Agent pipeline animates, tearsheet skeleton loads |
| Complete | Full tearsheet renders with staggered fade-in |
| Error | Inline error in affected agent row, retry button |
| Automating | Progress bar in AutomateModal, success flag from agent |
