import { useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [stage, setStage] = useState("ask");

  const [question, setQuestion] = useState(
    "Does buying NIFTY after a sharp fall work?"
  );

  const [analysis, setAnalysis] = useState(null);

  const [fallThreshold, setFallThreshold] = useState(2);
  const [consecutiveDays, setConsecutiveDays] = useState(3);
  const [holdingPeriod, setHoldingPeriod] = useState(3);

  const [testStart, setTestStart] = useState("2026-01-01");
  const [testEnd, setTestEnd] = useState("2026-01-15");

  const [transactionCost, setTransactionCost] = useState(0);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getConditionDescription() {
    if (!analysis?.condition) {
      return "";
    }

    if (analysis.condition.type === "consecutive_losses") {
      return `${consecutiveDays} consecutive losing days`;
    }

    return `Daily decline ≥ ${fallThreshold}%`;
  }

  function getHypothesis() {
    return `Buying NIFTY after ${getConditionDescription()} produces positive returns.`;
  }

  async function analyzeQuestion() {
    if (!question.trim()) {
      setError("Please enter a research question.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to analyze question."
        );
      }

      setAnalysis(data);

      if (data.condition?.type === "consecutive_losses") {
        setConsecutiveDays(
          data.condition.consecutive_days || 3
        );
      } else {
        setFallThreshold(
          data.condition.threshold || 2
        );
      }

      if (data.proposed?.holding_period) {
        setHoldingPeriod(
          data.proposed.holding_period
        );
      }

      if (data.proposed?.test_period) {
        setTestStart(
          data.proposed.test_period.start
        );

        setTestEnd(
          data.proposed.test_period.end
        );
      }

      setStage("clarify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function confirmDefinition() {
    setStage("define");
  }

  async function runExperiment() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/experiment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            condition_type:
              analysis?.condition?.type ||
              "daily_decline",

            fall_threshold:
              analysis?.condition?.type ===
              "daily_decline"
                ? Number(fallThreshold)
                : null,

            consecutive_days:
              analysis?.condition?.type ===
              "consecutive_losses"
                ? Number(consecutiveDays)
                : null,

            holding_period:
              Number(holdingPeriod),

            transaction_cost:
              Number(transactionCost),

            test_start: testStart,
            test_end: testEnd,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Experiment failed."
        );
      }

      setResult(data);
      setStage("test");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startLearning() {
    setStage("learn");
  }

  function startNewQuestion() {
    setStage("ask");
    setAnalysis(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="brand">TradeLens</div>

          <div className="tagline">
            Turn vague trading ideas into testable research experiments.
          </div>
        </div>
      </header>

      <main className="container">
        <div className="steps">
          <span className={stage === "ask" ? "active" : ""}>
            01 · ASK
          </span>

          <span className={stage === "clarify" ? "active" : ""}>
            02 · CLARIFY
          </span>

          <span className={stage === "define" ? "active" : ""}>
            03 · DEFINE
          </span>

          <span className={stage === "test" ? "active" : ""}>
            04 · TEST
          </span>

          <span className={stage === "learn" ? "active" : ""}>
            05 · LEARN
          </span>
        </div>

        {stage === "ask" && (
          <section className="card">
            <div className="eyebrow">01 · ASK</div>

            <h1>What do you want to test?</h1>

            <p className="muted">
              Start with a trading idea in natural language.
              TradeLens will identify ambiguity before testing it.
            </p>

            <textarea
              className="question-box"
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              rows="5"
            />

            <button
              className="primary-button"
              onClick={analyzeQuestion}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Analyze Question →"}
            </button>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </section>
        )}

        {stage === "clarify" && analysis && (
          <section className="card">
            <div className="eyebrow">
              02 · CLARIFY
            </div>

            <h1>Let's make the question testable.</h1>

            <p className="muted">
              {analysis.reasoning}
            </p>

            <div className="clarification-item">
              <div>
                <strong>RESEARCH CONDITION</strong>

                <p>
                  {getConditionDescription()}
                </p>
              </div>

              {analysis.condition?.type ===
                "daily_decline" && (
                <select
                  value={fallThreshold}
                  onChange={(e) =>
                    setFallThreshold(
                      Number(e.target.value)
                    )
                  }
                >
                  <option value="1">
                    Daily decline ≥ 1%
                  </option>

                  <option value="2">
                    Daily decline ≥ 2%
                  </option>

                  <option value="3">
                    Daily decline ≥ 3%
                  </option>

                  <option value="5">
                    Daily decline ≥ 5%
                  </option>
                </select>
              )}

              {analysis.condition?.type ===
                "consecutive_losses" && (
                <select
                  value={consecutiveDays}
                  onChange={(e) =>
                    setConsecutiveDays(
                      Number(e.target.value)
                    )
                  }
                >
                  <option value="2">
                    2 consecutive losing days
                  </option>

                  <option value="3">
                    3 consecutive losing days
                  </option>

                  <option value="4">
                    4 consecutive losing days
                  </option>

                  <option value="5">
                    5 consecutive losing days
                  </option>
                </select>
              )}
            </div>

            <div className="clarification-item">
              <div>
                <strong>ENTRY TIMING</strong>

                <p>
                  Next trading day open
                </p>
              </div>
            </div>

            <div className="clarification-item">
              <div>
                <strong>HOLDING PERIOD</strong>

                <p>
                  How long should the position be held?
                </p>
              </div>

              <select
                value={holdingPeriod}
                onChange={(e) =>
                  setHoldingPeriod(
                    Number(e.target.value)
                  )
                }
              >
                <option value="1">
                  1 trading day
                </option>

                <option value="3">
                  3 trading days
                </option>

                <option value="5">
                  5 trading days
                </option>

                <option value="10">
                  10 trading days
                </option>
              </select>
            </div>

            <div className="clarification-item">
              <div>
                <strong>TEST PERIOD</strong>

                <p>
                  Select the period used for the experiment.
                </p>
              </div>

              <div className="date-controls">
                <input
                  type="date"
                  value={testStart}
                  onChange={(e) =>
                    setTestStart(e.target.value)
                  }
                />

                <span>to</span>

                <input
                  type="date"
                  value={testEnd}
                  onChange={(e) =>
                    setTestEnd(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="clarification-item">
              <div>
                <strong>
                  ROUND-TRIP COST ASSUMPTION
                </strong>

                <p>
                  Cost deducted from each trade's return.
                </p>
              </div>

              <input
                type="number"
                min="0"
                step="0.01"
                value={transactionCost}
                onChange={(e) =>
                  setTransactionCost(
                    Number(e.target.value)
                  )
                }
              />
            </div>

            <div className="warning">
              <strong>Important:</strong>{" "}
              These parameters are visible assumptions.
              TradeLens does not silently invent important
              experiment settings.
            </div>

            <button
              className="primary-button"
              onClick={confirmDefinition}
            >
              Confirm Definition →
            </button>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </section>
        )}

        {stage === "define" && analysis && (
          <section className="card">
            <div className="eyebrow">
              03 · DEFINE
            </div>

            <h1>Experiment definition</h1>

            <div className="experiment-grid">
              <div>
                <span>MARKET</span>
                <strong>NIFTY</strong>
              </div>

              <div>
                <span>SIGNAL</span>

                <strong>
                  {getConditionDescription()}
                </strong>
              </div>

              <div>
                <span>ENTRY</span>

                <strong>
                  Next trading day open
                </strong>
              </div>

              <div>
                <span>HOLDING PERIOD</span>

                <strong>
                  {holdingPeriod} trading days
                </strong>
              </div>

              <div>
                <span>TEST PERIOD</span>

                <strong>
                  {testStart} → {testEnd}
                </strong>
              </div>

              <div>
                <span>ROUND-TRIP COST</span>

                <strong>
                  {transactionCost}%
                </strong>
              </div>

              <div>
                <span>DATA</span>

                <strong>
                  Illustrative sample
                </strong>
              </div>
            </div>

            <div className="hypothesis">
              <span>HYPOTHESIS</span>

              <p>
                {getHypothesis()}
              </p>
            </div>

            <button
              className="primary-button"
              onClick={runExperiment}
              disabled={loading}
            >
              {loading
                ? "Running Experiment..."
                : "Run Experiment →"}
            </button>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </section>
        )}

        {stage === "test" && result && (
          <section className="card">
            <div className="eyebrow">
              04 · TEST
            </div>

            <h1>Experiment completed.</h1>

            <p className="muted">
              TradeLens applied the confirmed experiment
              definition to the available dataset.
            </p>

            <div className="result-summary">
              <div>
                <span>Signal</span>

                <strong>
                  {getConditionDescription()}
                </strong>
              </div>

              <div>
                <span>Entry</span>

                <strong>
                  Next trading day open
                </strong>
              </div>

              <div>
                <span>Holding</span>

                <strong>
                  {holdingPeriod} trading days
                </strong>
              </div>

              <div>
                <span>Test period</span>

                <strong>
                  {testStart} → {testEnd}
                </strong>
              </div>
            </div>

            <h2>Test completed</h2>

            <p>
              Signal:{" "}
              <strong>
                {getConditionDescription()}
              </strong>{" "}
              · Entry: next trading day open · Holding
              period: {holdingPeriod} trading days.
            </p>

            <div className="metrics">
              <div>
                <span>SIGNALS FOUND</span>

                <strong>
                  {result.signals}
                </strong>
              </div>

              <div>
                <span>HOLDING PERIOD</span>

                <strong>
                  {holdingPeriod} days
                </strong>
              </div>

              <div>
                <span>DATA</span>

                <strong>
                  Illustrative sample
                </strong>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={startLearning}
            >
              View Results →
            </button>
          </section>
        )}

        {stage === "learn" && result && (
          <section className="card">
            <div className="eyebrow">
              05 · LEARN
            </div>

            <h1>What did the experiment show?</h1>

            <p className="muted">
              Buying NIFTY after{" "}
              {getConditionDescription()}, held for{" "}
              {holdingPeriod} trading days.
            </p>

            <div className="result-grid">
              <div>
                <span>SIGNALS</span>

                <strong>
                  {result.signals}
                </strong>
              </div>

              <div>
                <span>AVERAGE RETURN</span>

                <strong>
                  {result.average_return}%
                </strong>
              </div>

              <div>
                <span>MEDIAN RETURN</span>

                <strong>
                  {result.median_return}%
                </strong>
              </div>

              <div>
                <span>WIN RATE</span>

                <strong>
                  {result.win_rate}%
                </strong>
              </div>

              <div>
                <span>BEST RETURN</span>

                <strong>
                  +{result.best_return}%
                </strong>
              </div>

              <div>
                <span>WORST RETURN</span>

                <strong>
                  {result.worst_return}%
                </strong>
              </div>
            </div>

            <div className="insight">
              <h3>WHAT THE DATA SHOWS</h3>

              <p>
                The experiment found{" "}
                <strong>
                  {result.signals}
                </strong>{" "}
                qualifying signals with an average return
                of{" "}
                <strong>
                  {result.average_return}%
                </strong>{" "}
                in the selected sample period.
              </p>
            </div>

            <div className="warning">
              <h3>
                IMPORTANT LIMITATIONS & RISKS
              </h3>

              <ul>
                <li>
                  <strong>Illustrative data:</strong>{" "}
                  this sample is not actual NIFTY historical
                  performance.
                </li>

                <li>
                  <strong>
                    Transaction costs & slippage:
                  </strong>{" "}
                  real execution can reduce returns.
                </li>

                <li>
                  <strong>Look-ahead bias:</strong>{" "}
                  a proper backtest must ensure future
                  information is never used to make the signal.
                </li>

                <li>
                  <strong>Overfitting:</strong>{" "}
                  changing thresholds or holding periods
                  repeatedly can produce misleading results.
                </li>

                <li>
                  <strong>Insufficient evidence:</strong>{" "}
                  a small number of signals cannot establish
                  that a strategy reliably works.
                </li>
              </ul>

              <p>
                Therefore, these results are an experiment
                output, not a trading recommendation.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={startNewQuestion}
            >
              ← Start New Question
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;