import yfinance as yf
import pathlib

for t in ["AAPL", "SPY"]:
    df = yf.download(t, start="2019-01-01", end="2024-12-31", progress=False, auto_adjust=True)
    p = pathlib.Path("app/data/cache") / f"{t}_2019-01-01_2024-12-31.parquet"
    p.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(p)
    print("cached", t, len(df))
