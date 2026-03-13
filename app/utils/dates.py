from datetime import datetime, timedelta
import pandas as pd

def parse_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%Y-%m-%d")

def trading_days_between(start: str, end: str) -> int:
    s = parse_date(start)
    e = parse_date(end)
    count = 0
    d = s
    while d <= e:
        if d.weekday() < 5:
            count += 1
        d += timedelta(days=1)
    return count

def date_range_valid(start: str, end: str) -> bool:
    try:
        s = parse_date(start)
        e = parse_date(end)
        return s < e
    except ValueError:
        return False

def years_between(start: str, end: str) -> float:
    s = parse_date(start)
    e = parse_date(end)
    return (e - s).days / 365.25
