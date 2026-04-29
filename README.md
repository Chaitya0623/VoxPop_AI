# VoxPop AI — Community-Driven ML Alignment

**VoxPop AI** is an interactive platform that lets communities participate in shaping how machine-learning models balance competing objectives like **accuracy**, **fairness**, and **robustness**. Instead of a single engineer deciding these tradeoffs, VoxPop surfaces them as concrete decision lenses, value questions, and scenarios, then blends community input with research priors to drive model selection.

---

## Why It Matters

ML models deployed in high-stakes domains (criminal justice, lending, hiring) embed value judgments in their objective functions. VoxPop AI makes those judgments explicit by:

1. **Analyzing** a dataset to surface bias risks, sensitive attributes, and structural asymmetries.
2. **Selecting** a decision lens per dataset (multiple decisions per dataset).
3. **Eliciting** values through dilemma-style questions tailored to the decision lens.
4. **Blending** community votes with research-informed priors from the literature.
5. **Recommending** a model and allocation strategy backed by aggregated evidence.

---

## Features

| Area | Details |
|---|---|
| **LLM-Powered Analysis** | GPT-4o-mini analyzes uploaded datasets for risk level, problem statement, sensitive attributes, and suggested tradeoffs. Falls back to heuristic analysis when no API key is configured. |
| **LLM-Powered Scenarios** | GPT-4o-mini generates three tailored optimization scenarios per dataset, each with narrative, estimated performance, and equity impact. Falls back to curated templates per dataset. |
| **Sample Datasets** | Three built-in Kaggle fairness datasets — COMPAS Recidivism, Adult Census Income, German Credit Risk — ready to explore without uploading anything. |
| **Decision Lenses** | Each dataset supports multiple decision formulations (e.g., recidivism prediction, bail recommendation, rehabilitation assignment). |
| **Value Survey** | Dilemma-style fairness questions tailored to detected structural asymmetries and the chosen decision lens. |
| **Community Voting** | Stakeholders pick a preferred scenario, rate fairness priority, and leave optional comments. First-voter seeding injects 12 diverse sample votes to bootstrap the dashboard. |
| **Research-Informed Priors** | Model selection blends community responses with a paper knowledge corpus (papers.jsonl) to inform objective weighting and model-family selection. |
| **AutoML Simulation** | A simulated AutoML engine scores each scenario's weight profile and selects the best-fit model (Logistic Regression, Random Forest, XGBoost, Gradient Boosting, SVM). |
| **Monte Carlo Allocation** | Simulated allocation policies use research-aware priors and structural asymmetries to estimate fairness and efficiency tradeoffs. |
| **Analytics Dashboard** | Interactive Recharts visualizations plus a research-informed recommendation card with supporting papers. |
| **Persistent State** | Zustand store with `localStorage` persistence — votes, analyses, and scenarios survive page reloads. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 with `persist` middleware |
| Charts | Recharts 3 |
| LLM | OpenAI SDK (`gpt-4o-mini`) |
| Icons | Lucide React |
| Fonts | Geist Sans & Geist Mono (via `next/font`) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or yarn / pnpm / bun)
- **OpenAI API key** *(optional — the app works without one using heuristic fallbacks)*

### Installation

```bash
git clone <repo-url>
cd VoxPop_AI
npm install
```

### Environment Variables

Copy the example and add your key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-...   # leave empty to use heuristic-only mode
```

### Run

```bash
npm run dev
```

Open **http://localhost:3000**.

### Build for Production

```bash
npm run build && npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (dark theme, Geist fonts)
│   ├── datasets/page.tsx         # Dataset gallery + decision lens picker
│   ├── survey/page.tsx           # Value survey (Moral Machine-style)
│   ├── upload/page.tsx           # Dataset upload + sample dataset picker
│   ├── scenarios/page.tsx        # Scenario viewer + community vote form
│   ├── dashboard/page.tsx        # Analytics dashboard + recommendation
│   └── api/
│       ├── analyze/route.ts      # POST — LLM dataset analysis
│       └── scenarios/route.ts    # POST — LLM scenario generation
│       └── papers/route.ts       # GET — paper corpus for research priors
├── components/
│   ├── Navigation.tsx            # Top nav bar
│   ├── ScenarioCard.tsx          # Individual scenario display
│   ├── SurveyForm.tsx            # Vote / survey form
│   ├── DatasetSummaryCard.tsx    # Dataset overview card
│   ├── RecommendationCard.tsx    # Community recommendation display
│   └── charts/
│       ├── ScenarioPieChart.tsx   # Vote distribution pie chart
│       ├── PrincipleBarChart.tsx  # Fairness priority bar chart
│       └── DriftLineChart.tsx    # Fairness drift line chart
├── lib/
│   ├── types.ts                  # Core TypeScript interfaces
│   ├── openai.ts                 # OpenAI client utility
│   ├── analytics.ts              # Vote aggregation & recommendation engine
│   ├── paperKnowledge.ts          # Paper prior inference + model ranking
│   ├── paperCorpus.server.ts      # Server-only JSONL loader
│   ├── structuralAnalysis.ts      # Structural asymmetry detection
│   ├── preferenceInference.ts     # Value-response → objective weights
│   ├── sampleDatasets.ts         # 3 Kaggle fairness datasets
│   ├── sampleVotes.ts            # 12-vote bootstrap generator
│   ├── utils.ts                  # Tailwind merge helper
│   ├── automl/
│   │   └── simulatedAutoML.ts    # Simulated AutoML scoring engine
│   │   └── monteCarloAllocator.ts # Monte Carlo allocation simulator
│   └── mockAgents/
│       ├── datasetAgent.ts       # Dataset analysis agent (LLM + heuristic)
│       ├── scenarioAgent.ts      # Scenario generation agent (LLM + templates)
│       └── valueQuestionAgent.ts # Decision-specific value questions
└── store/
    └── useAppStore.ts            # Zustand store with localStorage persistence
```

---

## How It Works

### 1. Dataset + Decision Lens

Choose a dataset and select a decision lens (e.g., recidivism prediction vs bail recommendation). The **Dataset Agent** analyzes schema, sensitive attributes, and risk assessment. If an OpenAI key is configured, `gpt-4o-mini` enriches the analysis with a problem statement and tradeoffs.

### 2. Value Survey

The **Value Question Agent** generates dilemma-style questions tailored to the decision lens and detected structural asymmetries. User responses are mapped into objective weights over accuracy, fairness, and robustness.

### 3. Scenarios & Vote

The **Scenario Agent** generates three optimization scenarios — each with different accuracy/fairness/robustness weight profiles. A simulated **AutoML engine** scores each profile and selects the best-fit model. Stakeholders then cast a vote for their preferred scenario.

### 4. Dashboard

Aggregated votes power interactive charts and a community recommendation that blends community weights with research priors from the paper corpus. A Monte Carlo allocation module estimates fairness and efficiency tradeoffs in resource allocation decisions.

---

## LLM Integration & Graceful Fallback

The architecture is designed to work in two modes:

| Mode | Trigger | Behavior |
|---|---|---|
| **LLM-enhanced** | `OPENAI_API_KEY` is set in `.env.local` | Client agents call `/api/analyze` and `/api/scenarios` → server-side OpenAI SDK → GPT-4o-mini generates analysis & scenarios as structured JSON |
| **Heuristic-only** | No API key or API call fails | Agents use rule-based column heuristics, curated scenario templates per dataset (COMPAS / Adult / German), and generic fallback templates |

The fallback is **seamless** — users see the same UI in both modes, just with less nuanced narratives.

---

## Paper Knowledge Corpus

VoxPop AI uses a lightweight paper knowledge corpus (data/papers.jsonl) to derive research-informed priors that influence model selection. The corpus is loaded server-side and exposed via `/api/papers` for client usage in the dashboard.

---

## Roadmap

- [ ] Real AutoML integration (replace simulated scoring with actual model training)
- [ ] User authentication and per-user vote tracking
- [ ] Monte Carlo simulation of outcome distributions under different weight profiles
- [ ] Export recommendation reports (PDF / Markdown)
- [ ] Multi-dataset comparison view
- [ ] Real-time collaborative voting via WebSockets

---

## License

MIT
