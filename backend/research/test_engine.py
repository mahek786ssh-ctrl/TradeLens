import pandas as pd

from research_engine import run_experiment


# Small controlled dataset for testing.
data = pd.DataFrame(
    {
        "Date": [
            "2026-01-01",
            "2026-01-02",
            "2026-01-03",
            "2026-01-04",
            "2026-01-05",
        ],
        "Open": [
            100,
            98,
            99,
            100,
            101,
        ],
        "Close": [
            100,
            98,
            100,
            102,
            101,
        ],
    }
)


result = run_experiment(
    data=data,
    fall_threshold=2.0,
    holding_period=3,
    transaction_cost=0.0,
)


print(result)