const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { spawn } = require("child_process");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "TradeLens backend is running",
    ai_enabled: Boolean(OPENAI_API_KEY),
  });
});

const numberWords = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function detectConsecutiveLosses(question) {
  const text = question.toLowerCase();

  const numericMatch = text.match(
    /\b(\d+)\s+(?:consecutive|straight)\s+(?:losing|loss)\s+days?\b/i
  );

  if (numericMatch) {
    const days = Number(numericMatch[1]);

    if (days >= 2 && days <= 30) {
      return days;
    }
  }

  const wordPattern = Object.keys(numberWords).join("|");

  const wordMatch = text.match(
    new RegExp(
      `\\b(${wordPattern})\\s+(?:consecutive|straight)\\s+(?:losing|loss)\\s+days?\\b`,
      "i"
    )
  );

  if (wordMatch) {
    const days = numberWords[wordMatch[1].toLowerCase()];

    if (days >= 2 && days <= 30) {
      return days;
    }
  }

  return null;
}

function extractResponseText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (Array.isArray(item.content)) {
        for (const content of item.content) {
          if (content.text) {
            return content.text;
          }
        }
      }
    }
  }

  return "";
}

async function analyzeWithAI(question) {
  const prompt = `
You are the research-intent layer of TradeLens.

TradeLens converts vague trading questions into structured research experiments.

User question:
"${question}"

Return ONLY valid JSON using this structure:

{
  "reasoning": "short explanation",
  "condition": {
    "type": "daily_decline" or "consecutive_losses",
    "description": "human readable condition",
    "threshold": number or null,
    "consecutive_days": number or null
  },
  "missing": [],
  "proposed": {
    "entry_timing": "next trading day open",
    "holding_period": 3,
    "test_period": {
      "start": "2026-01-01",
      "end": "2026-01-15"
    },
    "include_costs": true
  }
}

Rules:

1. "Sharp fall", "big fall", "drop", etc. without a percentage
   should be treated as an ambiguous daily-decline condition.

2. If the question explicitly contains a consecutive-loss condition,
   use "consecutive_losses".

3. Never convert "three consecutive losing days" into a percentage decline.

4. If consecutive_days is specified, preserve the number exactly.

5. Do not calculate trading results.

6. Important experiment parameters should remain visible assumptions.

7. Keep reasoning short.
`;

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();

  const text = extractResponseText(data);

  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function fallbackAnalysis(question) {
  const consecutiveDays = detectConsecutiveLosses(question);

  if (consecutiveDays !== null) {
    return {
      reasoning:
        "The question defines a consecutive-loss condition, but entry timing, holding period, test period, and trading costs still need to be specified.",

      condition: {
        type: "consecutive_losses",
        description: `${consecutiveDays} consecutive losing days`,
        threshold: null,
        consecutive_days: consecutiveDays,
      },

      missing: [
        "Entry timing",
        "Holding period",
        "Test period",
        "Trading costs",
      ],

      proposed: {
        entry_timing: "next trading day open",
        holding_period: 3,

        test_period: {
          start: "2026-01-01",
          end: "2026-01-15",
        },

        include_costs: true,
      },
    };
  }

  const lower = question.toLowerCase();

  const percentMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);

  const threshold = percentMatch ? Number(percentMatch[1]) : 2;

  return {
    reasoning:
      "The question contains an ambiguous fall condition, so a percentage threshold must be confirmed before testing.",

    condition: {
      type: "daily_decline",
      description: `daily decline ≥ ${threshold}%`,
      threshold,
      consecutive_days: null,
    },

    missing: [
      "Exact fall threshold",
      "Entry timing",
      "Holding period",
      "Test period",
      "Trading costs",
    ],

    proposed: {
      entry_timing: "next trading day open",
      holding_period: 3,

      test_period: {
        start: "2026-01-01",
        end: "2026-01-15",
      },

      include_costs: true,
    },
  };
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    const detectedConsecutiveDays =
      detectConsecutiveLosses(question);

    if (detectedConsecutiveDays !== null) {
      const analysis = {
        reasoning:
          "The question explicitly defines a consecutive-loss condition. Entry timing, holding period, test period, and trading costs still need to be specified.",

        condition: {
          type: "consecutive_losses",
          description:
            `${detectedConsecutiveDays} consecutive losing days`,
          threshold: null,
          consecutive_days: detectedConsecutiveDays,
        },

        missing: [
          "Entry timing",
          "Holding period",
          "Test period",
          "Trading costs",
        ],

        proposed: {
          entry_timing: "next trading day open",
          holding_period: 3,

          test_period: {
            start: "2026-01-01",
            end: "2026-01-15",
          },

          include_costs: true,
        },
      };

      console.log(
        "Detected explicit consecutive-loss condition:",
        detectedConsecutiveDays
      );

      return res.json(analysis);
    }

    let analysis;

    if (OPENAI_API_KEY) {
      try {
        analysis = await analyzeWithAI(question);
      } catch (error) {
        console.error(
          "AI analysis failed:",
          error.message
        );

        analysis = fallbackAnalysis(question);
      }
    } else {
      analysis = fallbackAnalysis(question);
    }

    res.json(analysis);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to analyze the question.",
    });
  }
});

app.post("/api/experiment", (req, res) => {
  const {
    condition_type,
    fall_threshold,
    consecutive_days,
    holding_period,
    transaction_cost,
    test_start,
    test_end,
  } = req.body;

  const pythonProcess = spawn(
    "python",
    ["research_engine.py"],
    {
      cwd: __dirname + "/research",
    }
  );

  let output = "";
  let errorOutput = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(errorOutput);

      return res.status(500).json({
        error: "Research engine failed.",
        details: errorOutput,
      });
    }

    try {
      const result = JSON.parse(output);

      res.json(result);
    } catch (error) {
      console.error(
        "Invalid Python output:",
        output
      );

      res.status(500).json({
        error: "Could not parse research engine result.",
      });
    }
  });

  pythonProcess.stdin.write(
    JSON.stringify({
      condition_type:
        condition_type || "daily_decline",

      fall_threshold:
        fall_threshold ?? null,

      consecutive_days:
        consecutive_days ?? null,

      holding_period: Number(
        holding_period || 3
      ),

      transaction_cost: Number(
        transaction_cost || 0
      ),

      test_start:
        test_start || "2026-01-01",

      test_end:
        test_end || "2026-01-15",
    })
  );

  pythonProcess.stdin.end();
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `TradeLens backend running on port ${PORT}`
  );

  console.log(
    `AI analysis: ${
      OPENAI_API_KEY
        ? "ENABLED"
        : "DISABLED"
    }`
  );
});