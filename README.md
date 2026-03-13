# IRIS: Intelligent Reasoning & Inferential Simulator-hackanova-26
## System Architecture

```mermaid
flowchart TD

A[Trader / User] --> C[Manager / Orchestrator Agent]

C --> D1[Backtest Agent]
C --> D2[Risk Analysis Agent]
C --> D3[Signal Research Agent]
C --> D4[Portfolio Construction Agent]
C --> D5[Derivatives Pricing Agent]
C --> D6[Benchmark / Fixed Rate Agent]
C --> D7[Market Microstructure Agent]

D1 --> E[Verifier Agent]
D2 --> E
D3 --> E
D4 --> E
D5 --> E
D6 --> E
D7 --> E

E --> F[Comparator Agent]

F --> C

C -->|Result and Ask| A
A -->|If OK| C

C -->|Flag| G[Automater]
