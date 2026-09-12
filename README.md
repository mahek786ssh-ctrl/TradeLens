# TradeLens

**Turn vague trading ideas into structured, testable research experiments.**

TradeLens is an AI-assisted research prototype that helps users turn natural-language trading questions into clearly defined experiments.

It follows a simple research workflow:

**ASK → CLARIFY → DEFINE → TEST → LEARN**

The prototype focuses on research reasoning rather than building a production trading platform.

---

## Problem

Trading questions are often vague.

For example:

> "Does buying NIFTY after a sharp fall work?"

The phrase "sharp fall" is ambiguous. A meaningful experiment also needs an entry rule, holding period, test period, and cost assumptions.

TradeLens helps identify these missing parameters before testing the idea.

---

## How It Works

### 1. ASK

The user enters a natural-language research question.

Example:

> Does buying NIFTY after three consecutive losing days work?

### 2. CLARIFY

The system identifies important missing information and interprets the research condition.

For example:

- Condition: 3 consecutive losing days
- Entry: Next trading day open
- Holding period: 3 trading days
- Transaction costs: Included as an experiment assumption

The system avoids silently inventing important parameters.

### 3. DEFINE

The assumptions are presented as a structured experiment.

Example:

| Parameter | Definition |
|---|---|
| Market | NIFTY |
| Signal | 3 consecutive losing days |
| Entry | Next trading day open |
| Holding period | 3 trading days |
| Costs | Transaction cost assumption |
| Data | Illustrative research dataset |

### 4. TEST

The experiment is processed by a deterministic Python research engine.

The engine calculates:

- Number of signals
- Average return
- Median return
- Win rate
- Best return
- Worst return

### 5. LEARN

The results are presented separately from the interpretation.

TradeLens clearly distinguishes between:

- What the data shows
- What the system concludes
- Limitations of the experiment
- Possible next research questions

---

## Architecture

```text
React Frontend
      |
      v
Node.js + Express Backend
      |
      +--------------------+
      |                    |
      v                    v
OpenAI API          Python Research Engine
      |                    |
      |                    v
      |                Pandas
      |                    |
      +---------+----------+
                |
                v
          Experiment Results

          Frontend




##The React frontend provides the research workflow and user interface.

Technologies:

React
Vite
JavaScript
CSS
Backend

The Node.js backend connects the frontend with the AI analysis layer and Python research engine.

Technologies:

Node.js
Express
CORS
dotenv
Research Engine

The research engine performs deterministic experiment calculations.

Technologies:

Python
Pandas
NumPy
AI Design

The AI layer is responsible for understanding the user's natural-language research question.

It helps identify:

Market
Research condition
Missing information
Proposed assumptions
Research hypothesis

For example, the question:

Does buying NIFTY after three consecutive losing days work?

is interpreted as a condition involving:

3 consecutive losing days

The AI does not calculate the trading returns.

Instead, the workflow is:

Natural-language question
          |
          v
      AI analysis
          |
          v
Structured experiment
          |
          v
Python research engine
          |
          v
Calculated results
          |
          v
Readable interpretation

This separation was an intentional design decision.

It prevents the language model from being responsible for numerical calculations and makes the experiment easier to inspect and reason about.

Key Product Decision

A major product decision in TradeLens is that important experiment parameters should not be silently invented.

For ambiguous questions, the system identifies what is missing and presents proposed assumptions.

This is important because different interpretations of the same trading question can produce completely different results.

The prototype therefore emphasizes:

Clarification before calculation.

Experiment Conditions

The current prototype supports research conditions such as:

Daily decline

Example:

Does buying NIFTY after a sharp fall work?

The system can represent the condition as a daily decline threshold, such as:

Daily decline ≥ 2%

Consecutive losing days

Example:

Does buying NIFTY after three consecutive losing days work?

The system represents the condition as:

3 consecutive losing days

These conditions are converted into structured parameters before being passed to the research engine.

Research Assumptions

The prototype uses a controlled/illustrative dataset for demonstration.

Important assumptions include:

Entry occurs at the next trading day's open.
Holding periods are measured in trading days.
The experiment can include a transaction-cost assumption.
The current dataset is intended for demonstrating the research workflow.
Results from the illustrative dataset should not be interpreted as actual historical NIFTY performance.
The prototype is for research exploration and education, not live trading.
Risks and Limitations

Historical experiments can produce misleading conclusions if the experiment is poorly designed.

TradeLens considers risks such as:

Ambiguous strategy definitions
Data quality
Look-ahead bias
Transaction costs
Slippage
Overfitting
Insufficient sample size
Selection bias

The prototype therefore presents results as experimental evidence rather than guaranteed outcomes.

Project Structure
TradeLens/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── backend/
│   ├── data/
│   │   └── nifty.csv
│   ├── research/
│   │   ├── research_engine.py
│   │   └── test_engine.py
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
└── README.md
API Structure

The backend exposes endpoints for the main prototype workflow.

Health Check
GET /api/health

Used to verify that the backend is running.

AI Analysis
POST /api/analyze

Used to interpret the user's natural-language research question and produce structured research information.

Experiment Execution
POST /api/experiment

Used to send the structured experiment to the Python research engine and return calculated results.

How to Run Locally
Prerequisites

Install:

Node.js
npm
Python 3.12 or compatible Python version
1. Clone the Repository
git clone https://github.com/mahek786ssh-ctrl/TradeLens.git
cd TradeLens
2. Install Frontend Dependencies
cd frontend
npm install

Start the frontend:

npm run dev

Vite will provide a local development URL.

3. Install Backend Dependencies

Open a second terminal.

From the project root:

cd backend
npm install

Start the backend:

npm run dev

The backend runs on:

http://localhost:5000
4. Set Up the Python Research Engine

From the project root:

cd backend/research
python -m venv .venv

On Windows PowerShell:

.\.venv\Scripts\Activate.ps1

Install the Python dependencies:

pip install pandas numpy
Environment Variables

The backend uses an environment file for the OpenAI API key.

Create the following file locally:

backend/.env

Example:

OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.6-luna

The actual API key must never be committed to GitHub.

Testing the Research Engine

The Python research engine includes a controlled test.

From:

backend/research

run:

python test_engine.py

The test verifies that the engine can identify research signals and calculate experiment returns.

Example Research Question

A primary example used by the prototype is:

Does buying NIFTY after three consecutive losing days work?

TradeLens interprets this as:

Condition:
3 consecutive losing days

Entry:
Next trading day open

Holding period:
3 trading days

The structured experiment is then tested by the Python research engine.

The main product idea is:

A vague research question should become an explicit experiment before a conclusion is drawn.

Scope

TradeLens intentionally does not attempt to build a complete trading platform.

The prototype does not include:

Live trading
Brokerage integration
Portfolio management
User authentication
Real-time trading infrastructure
Production-grade backtesting
A large strategy library
Automated investment decisions

The scope is intentionally focused on the reasoning workflow.

AI Usage

AI tools were used during development for:

Exploring implementation approaches
Debugging development issues
Reviewing architecture
Improving the user interface
Structuring the natural-language interpretation layer
Identifying edge cases
Reviewing implementation decisions

AI-generated suggestions were reviewed and modified rather than being blindly accepted.

The main independent design decision was the separation of:

Natural-language interpretation
            ↓
Structured experiment
            ↓
Deterministic research calculation
            ↓
Results and interpretation

This ensures that the AI assists with understanding the research question while the numerical calculations remain deterministic.

Design Priorities

The prototype prioritizes:

Clear handling of ambiguity
Explicit assumptions
Separation of AI interpretation and numerical calculation
Explainable experiment definitions
A focused user journey
A small but working prototype

The goal is to demonstrate reasoning and product thinking rather than maximize the number of features.

Future Improvements

With additional development time, TradeLens could be extended with:

Larger verified historical datasets
More research conditions
Configurable entry and exit rules
More detailed transaction-cost modelling
Slippage modelling
Statistical significance testing
Confidence intervals
Experiment comparison
Result visualizations
Stronger data validation
More robust historical backtesting
Additional market instruments
Disclaimer

TradeLens is an educational research prototype.

The results generated by the current prototype should not be treated as financial advice or as a recommendation to buy or sell any security.

The current dataset and experiment implementation are intended to demonstrate the research workflow rather than provide production-grade investment analysis.
