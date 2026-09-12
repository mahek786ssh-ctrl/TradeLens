import pandas as pd


def run_experiment(
    data: pd.DataFrame,
    condition_type: str,
    fall_threshold: float | None = None,
    consecutive_days: int | None = None,
    holding_period: int = 3,
    transaction_cost: float = 0.0,
    test_start: str | None = None,
    test_end: str | None = None,
):
    required_columns = {"Date", "Open", "Close"}
    missing_columns = required_columns - set(data.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {', '.join(sorted(missing_columns))}"
        )

    if holding_period < 1:
        raise ValueError("Holding period must be at least 1 trading day.")

    if condition_type not in {"daily_decline", "consecutive_losses"}:
        raise ValueError(
            "Condition type must be daily_decline or consecutive_losses."
        )

    if condition_type == "daily_decline":
        if fall_threshold is None or fall_threshold <= 0:
            raise ValueError("Fall threshold must be greater than 0.")

    if condition_type == "consecutive_losses":
        if consecutive_days is None or consecutive_days < 2:
            raise ValueError(
                "Consecutive losing days must be at least 2."
            )

    data = data.copy()

    data["Date"] = pd.to_datetime(data["Date"])
    data = data.sort_values("Date").reset_index(drop=True)

    # Apply the selected test period.
    if test_start:
        data = data[data["Date"] >= pd.to_datetime(test_start)]

    if test_end:
        data = data[data["Date"] <= pd.to_datetime(test_end)]

    data = data.reset_index(drop=True)

    if len(data) < holding_period + 2:
        return {
            "signals": 0,
            "average_return": 0,
            "median_return": 0,
            "win_rate": 0,
            "best_return": 0,
            "worst_return": 0,
            "trades": [],
            "test_start": test_start,
            "test_end": test_end,
        }

    # Daily close-to-close percentage change.
    data["daily_change"] = data["Close"].pct_change() * 100

    trades = []

    loss_streak = 0

    for i in range(1, len(data) - holding_period):

        signal = False

        if condition_type == "daily_decline":
            signal = data.loc[i, "daily_change"] <= -float(fall_threshold)

        elif condition_type == "consecutive_losses":

            if data.loc[i, "daily_change"] < 0:
                loss_streak += 1
            else:
                loss_streak = 0

            # Trigger only when the streak reaches N.
            # This prevents overlapping signals during a longer losing streak.
            if loss_streak == int(consecutive_days):
                signal = True

        if not signal:
            continue

        entry_index = i + 1
        exit_index = entry_index + holding_period - 1

        if exit_index >= len(data):
            continue

        entry_price = data.loc[entry_index, "Open"]
        exit_price = data.loc[exit_index, "Close"]

        gross_return = (
            (exit_price - entry_price) / entry_price
        ) * 100

        net_return = gross_return - transaction_cost

        trades.append(
            {
                "signal_date": data.loc[i, "Date"].strftime("%Y-%m-%d"),
                "entry_date": data.loc[entry_index, "Date"].strftime("%Y-%m-%d"),
                "exit_date": data.loc[exit_index, "Date"].strftime("%Y-%m-%d"),
                "entry_price": round(float(entry_price), 2),
                "exit_price": round(float(exit_price), 2),
                "gross_return": round(float(gross_return), 4),
                "net_return": round(float(net_return), 4),
            }
        )

    if not trades:
        return {
            "signals": 0,
            "average_return": 0,
            "median_return": 0,
            "win_rate": 0,
            "best_return": 0,
            "worst_return": 0,
            "trades": [],
            "test_start": test_start,
            "test_end": test_end,
        }

    returns = pd.Series(
        [trade["net_return"] for trade in trades]
    )

    return {
        "signals": len(trades),
        "average_return": round(float(returns.mean()), 4),
        "median_return": round(float(returns.median()), 4),
        "win_rate": round(float((returns > 0).mean() * 100), 2),
        "best_return": round(float(returns.max()), 4),
        "worst_return": round(float(returns.min()), 4),
        "trades": trades,
        "test_start": test_start,
        "test_end": test_end,
    }


if __name__ == "__main__":
    import json
    import sys

    config = json.loads(sys.stdin.read())

    # Small illustrative development dataset.
    # This is intentionally NOT presented as real NIFTY data.
    data = pd.DataFrame(
        {
            "Date": pd.bdate_range(
                "2026-01-01",
                periods=20
            ),
            "Open": [
                100, 98, 99, 100, 101,
                100, 97, 98, 99, 101,
                102, 100, 99, 101, 103,
                102, 99, 100, 102, 104
            ],
            "Close": [
                100, 98, 100, 102, 101,
                100, 97, 99, 101, 103,
                102, 100, 99, 102, 104,
                102, 99, 101, 103, 105
            ],
        }
    )

    result = run_experiment(
        data=data,
        condition_type=config.get(
            "condition_type",
            "daily_decline"
        ),
        fall_threshold=config.get("fall_threshold"),
        consecutive_days=config.get("consecutive_days"),
        holding_period=int(
            config.get("holding_period", 3)
        ),
        transaction_cost=float(
            config.get("transaction_cost", 0.0)
        ),
        test_start=config.get("test_start"),
        test_end=config.get("test_end"),
    )

    print(json.dumps(result))