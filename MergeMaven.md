# MergeMaven: Complete Updated Implementation Plan

---

## 📌 Project Title

\*\*"MergeGuard: Bayesian Pull Request Conflict Predictor"\*\*

---

## 📝 Description

### In Simple Words
When two developers work on the same code and open Pull Requests, merging one can break the other. MergeGuard predicts which PRs will conflict BEFORE anyone merges anything — so teams can plan merge order and avoid hours of wasted work.

### Technical Description
MergeGuard analyzes open Pull Requests from a GitHub repository, extracts structural and historical features, and uses a Bayesian Network to predict the probability that merging one PR will cause conflicts with another. It learns from historical merge data to distinguish risky PR pairs from safe ones. The system includes an interactive frontend with conflict visualization, a what-if merge simulator, and file-level drill-down.

---

## 🎯 What It Does

\| Step \| Action \|
\|------\|--------\|
\| \*\*1. Fetch\*\* \| Pulls open PR data from GitHub API (files changed, lines modified, authors, timestamps) \|
\| \*\*2. Extract\*\* \| Computes overlap features between every pair of PRs (file overlap, line overlap, module overlap) \|
\| \*\*3. Analyze\*\* \| Checks historical conflict patterns for the same files/modules \|
\| \*\*4. Predict\*\* \| Runs Bayesian inference to output conflict probability for each PR pair \|
\| \*\*5. Rank\*\* \| Sorts PR pairs by risk level (High / Moderate / Low) \|
\| \*\*6. Plan\*\* \| Generates optimal merge order to minimize conflicts \|
\| \*\*7. Visualize\*\* \| Shows interactive graph, heatmap, and file-level details \|
\| \*\*8. Verify\*\* \| Simulates merges to prove predictions are correct \|

---

## ✨ Complete Feature List

### Core Features (Must Have)

\| # \| Feature \| What It Does \|
\|---\|---------\|--------------\|
\| 1 \| \*\*Repository Input\*\* \| User enters GitHub repo URL \|
\| 2 \| \*\*PR Fetcher\*\* \| Pulls all open PRs with file changes, authors, timestamps \|
\| 3 \| \*\*File Overlap Detector\*\* \| Finds which PRs modify the same files \|
\| 4 \| \*\*Line Overlap Calculator\*\* \| Checks if PRs modify the same lines \|
\| 5 \| \*\*Module Overlap Analyzer\*\* \| Groups files into modules, checks module-level overlap \|
\| 6 \| \*\*Historical Pattern Learner\*\* \| Analyzes past merges to learn conflict patterns \|
\| 7 \| \*\*Bayesian Predictor\*\* \| Outputs conflict probability for every PR pair \|
\| 8 \| \*\*Risk Categorizer\*\* \| Labels pairs as High/Moderate/Low risk \|
\| 9 \| \*\*Merge Order Recommender\*\* \| Suggests optimal sequence to avoid conflicts \|
\| 10 \| \*\*Risk Heatmap\*\* \| Visual grid of PR-to-PR conflict probabilities \|

### Advanced Features (Nice to Have)

\| # \| Feature \| What It Does \|
\|---\|---------\|--------------\|
\| 11 \| \*\*Conflict Ground Truth\*\* \| Simulates merges via \`git merge-tree\` to verify predictions \|
\| 12 \| \*\*Confidence Intervals\*\* \| Shows how certain the model is \|
\| 13 \| \*\*File-Level Breakdown\*\* \| Lists exactly which files cause the risk \|
\| 14 \| \*\*Author Analysis\*\* \| Shows if specific developers tend to conflict \|
\| 15 \| \*\*Export Report\*\* \| Download as JSON/PDF for CI/CD integration \|
\| 16 \| \*\*Historical Trend\*\* \| Shows how conflict rate changes over time \|

### Frontend Interactive Features (NEW)

\| # \| Feature \| What It Does \| Impact \|
\|---\|---------\|--------------\|--------\|
\| 17 \| \*\*Interactive Conflict Graph\*\* \| Node-link graph where PRs are nodes, red/yellow lines show conflict risk. Drag nodes to explore. Click to see details. \| See conflict clusters instantly \|
\| 18 \| \*\*What-If Merge Simulator\*\* \| Drag-and-drop interface to build merge queue. Real-time conflict probability updates as you add/remove PRs. \| Plan merges interactively \|
\| 19 \| \*\*File-Level Drill-Down\*\* \| Click any conflict pair to see exact files, line numbers, and side-by-side diffs. Know exactly what to fix. \| Actionable insight \|

---

## 🏗️ System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React) │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ Repo Input │ │ Conflict │ │ What-If Merge │ │
│ │ Page │ │ Graph │ │ Simulator │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ Risk Heatmap │ │ Merge Order │ │ File Drill-Down │ │
│ │ │ │ List │ │ │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
 │ HTTP/REST API
┌──────────────────────────▼──────────────────────────────────┐
│ BACKEND (Flask) │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ GitHub │ │ Feature │ │ Bayesian │ │
│ │ Fetcher │ │ Extractor │ │ Predictor │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ Merge Order │ │ Report │ │ Training │ │
│ │ Planner │ │ Generator │ │ Module │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ │
│ │ Git Merge │ │ File Diff │ │
│ │ Simulator │ │ Analyzer │ │
│ └──────────────┘ └──────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
 │
┌──────────────────────────▼──────────────────────────────────┐
│ DATABASE (SQLite) │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ PR Data │ │ Features │ │ Predictions │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ │
│ │ File Changes │ │ Historical │ │
│ │ │ │ Merges │ │
│ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 💻 Complete Tech Stack

### Backend

\| Component \| Technology \| Version \| Purpose \|
\|-----------\|------------\|---------\|---------\|
\| \*\*Language\*\* \| Python \| 3.10+ \| Core development \|
\| \*\*Web Framework\*\* \| Flask \| 2.3+ \| REST API \|
\| \*\*GitHub API\*\* \| \`PyGithub\` \| 2.1+ \| Fetch PR data, file diffs \|
\| \*\*Git Operations\*\* \| \`GitPython\` \| 3.1+ \| Local repo analysis, merge simulation \|
\| \*\*Bayesian Model\*\* \| \`pyAgrum\` \| 1.13+ \| Belief network \|
\| \*\*Data Processing\*\* \| \`pandas\`, \`numpy\` \| Latest \| Feature manipulation \|
\| \*\*Storage\*\* \| \`SQLite\` + \`SQLAlchemy\` \| Built-in \| Persistent data \|
\| \*\*Visualization\*\* \| \`matplotlib\`, \`seaborn\` \| Latest \| Heatmaps \|
\| \*\*CLI\*\* \| \`click\` \| 8.1+ \| Command-line interface \|
\| \*\*Testing\*\* \| \`pytest\` \| 7.4+ \| Unit tests \|

### Frontend

\| Component \| Technology \| Purpose \|
\|-----------\|------------\|---------\|
\| \*\*Framework\*\* \| React 18 \| UI components \|
\| \*\*Language\*\* \| TypeScript \| Type safety \|
\| \*\*Styling\*\* \| Tailwind CSS \| Quick, clean UI \|
\| \*\*HTTP Client\*\* \| Axios \| API calls \|
\| \*\*Graph Visualization\*\* \| D3.js \| Force-directed conflict graph \|
\| \*\*Drag and Drop\*\* \| React DnD \| What-if merge simulator \|
\| \*\*Charts\*\* \| Chart.js \| Heatmaps \|
\| \*\*Diff Viewer\*\* \| React Diff Viewer \| Side-by-side code comparison \|
\| \*\*Build Tool\*\* \| Vite \| Fast development \|

### Database

\| Component \| Technology \| Purpose \|
\|-----------\|------------\|---------\|
\| \*\*Primary Storage\*\* \| SQLite \| All persistent data \|
\| \*\*ORM\*\* \| SQLAlchemy \| Python database interface \|

---

## 🗄️ Database Schema

\`\`\`sql
-- Table 1: Repositories analyzed
CREATE TABLE repositories (
 id INTEGER PRIMARY KEY,
 url TEXT UNIQUE,
 name TEXT,
 last\_analyzed TIMESTAMP
);

-- Table 2: Pull Requests
CREATE TABLE pull\_requests (
 id INTEGER PRIMARY KEY,
 repo\_id INTEGER,
 pr\_number INTEGER,
 title TEXT,
 author TEXT,
 created\_at TIMESTAMP,
 lines\_added INTEGER,
 lines\_deleted INTEGER,
 files\_changed INTEGER
);

-- Table 3: Files changed per PR
CREATE TABLE pr\_files (
 id INTEGER PRIMARY KEY,
 pr\_id INTEGER,
 file\_path TEXT,
 lines\_added INTEGER,
 lines\_deleted INTEGER,
 line\_ranges TEXT -- JSON: \[\[45,67\], \[120,140\]\]
);

-- Table 4: Extracted features per PR pair
CREATE TABLE pr\_pair\_features (
 id INTEGER PRIMARY KEY,
 pr\_a\_id INTEGER,
 pr\_b\_id INTEGER,
 file\_overlap REAL,
 line\_overlap REAL,
 module\_overlap REAL,
 history\_conflict\_rate REAL
);

-- Table 5: Predictions
CREATE TABLE predictions (
 id INTEGER PRIMARY KEY,
 pr\_a\_id INTEGER,
 pr\_b\_id INTEGER,
 conflict\_probability REAL,
 risk\_level TEXT,
 confidence REAL,
 predicted\_at TIMESTAMP
);

-- Table 6: Historical merges (for training)
CREATE TABLE historical\_merges (
 id INTEGER PRIMARY KEY,
 repo\_id INTEGER,
 pr\_a\_number INTEGER,
 pr\_b\_number INTEGER,
 did\_conflict BOOLEAN,
 merged\_at TIMESTAMP
);
\`\`\`

---

## 🧠 Algorithms Used (From Syllabus)

\| Syllabus Unit \| Algorithm/Concept \| How It's Used \|
\|---------------\|-------------------\|---------------\|
\| \*\*Unit I — Search Algorithms\*\* \| BFS/DFS over file dependency graph \| Find which files are connected and likely to overlap \|
\| \*\*Unit I — Informed Search\*\* \| A\* heuristic \| Find shortest path between conflicting file changes \|
\| \*\*Unit I — Online Search\*\* \| Adaptive prediction \| Model updates as new PRs are opened or modified \|
\| \*\*Unit I — Uncertainty\*\* \| Handling incomplete data \| Some PRs have partial info; model reports confidence \|
\| \*\*Unit II — Bayesian Networks\*\* \| Belief Network construction \| Core model: file overlap, line overlap, history → conflict probability \|
\| \*\*Unit II — Bayes' Rule\*\* \| Posterior inference \| Update probability given new PR data \|
\| \*\*Unit II — Constraint Propagation\*\* \| Overlap constraints \| Propagate constraints across PR pairs \|
\| \*\*Unit II — Decision Trees\*\* \| Classification layer \| Classify risk level (High/Moderate/Low) \|
\| \*\*Unit II — Propositional Logic\*\* \| Rule-based filtering \| "If file overlap = 0, then conflict probability is low" \|
\| \*\*Unit IV — Planning\*\* \| Merge order planning \| Generate optimal sequence to avoid conflicts \|
\| \*\*Unit V — Bayes' Rule & Inference\*\* \| Probabilistic inference \| Core prediction engine \|
\| \*\*Unit V — Uncertainty Modeling\*\* \| Full joint distributions \| Model dependencies between features \|
\| \*\*Unit V — Learning Decision Trees\*\* \| Supervised learning \| Learn conflict patterns from history \|

---

## 🔄 How the Project Executes (Step by Step)

### Phase 1: User Input (Frontend)

1. User opens the web app
2. Enters a GitHub repo URL: \`https://github.com/psf/requests\`
3. Clicks "Analyze"
4. Frontend sends \`POST /api/analyze\` with the URL

### Phase 2: PR Fetching (Backend)

1. Backend receives URL
2. Uses \`PyGithub\` to fetch:
 - All open PRs
 - Files changed per PR
 - Lines added/deleted per file
 - Authors and timestamps
3. Stores everything in SQLite
4. Returns a list of PRs to frontend

### Phase 3: Feature Extraction (Backend)

For every pair of PRs (e.g., PR #1 and PR #2):

1. \*\*File Overlap\*\*: Do they touch the same files?
 \`\`\`
 File Overlap = (Shared Files) / (Total Files)
 Example: PR#1 touches \[a.py, b.py\], PR#2 touches \[b.py, c.py\]
 Shared = {b.py}, Total = {a.py, b.py, c.py}
 File Overlap = 1/3 = 0.33
 \`\`\`

2. \*\*Line Overlap\*\*: Do they modify the same lines?
 \`\`\`
 For shared files, check if line ranges intersect
 Line Overlap = (Overlapping Lines) / (Total Lines Changed)
 \`\`\`

3. \*\*Module Overlap\*\*: Are the files in the same module?
 \`\`\`
 Module Overlap = (Shared Modules) / (Total Modules)
 Example: PR#1 touches auth/, PR#2 touches auth/ → Module Overlap = 1.0
 \`\`\`

4. \*\*Historical Conflict Rate\*\*: How often do these files conflict in past merges?
 \`\`\`
 History Rate = (Past Conflicts on These Files) / (Total Past Merges)
 \`\`\`

### Phase 4: Bayesian Prediction (Backend)

1. Load the trained Bayesian Network
2. For each PR pair, set evidence:
 \`\`\`
 Evidence = {
 'file\_overlap': 'High', # > 0.5
 'line\_overlap': 'Medium', # 0.2 - 0.5
 'module\_overlap': 'High',
 'history\_rate': 'Medium'
 }
 \`\`\`
3. Run inference:
 \`\`\`
 P(Conflict \| Evidence) = 0.87 → 87% probability
 \`\`\`
4. Store prediction in database

### Phase 5: Merge Order Planning (Backend)

1. Build a graph where PRs are nodes and conflict probability is edge weight
2. Use \*\*Topological Sort + Greedy\*\* to find merge order:
 - Start with PRs that have NO conflicts
 - Then PRs with low conflict probability
 - Merge conflicting PRs last, one at a time
3. Output: "Merge PR #3 → #1 → #4 → #2"

### Phase 6: Visualization (Frontend)

1. Frontend fetches predictions from \`GET /api/predictions/{repo\_id}\`
2. Renders:
 - \*\*Interactive Conflict Graph\*\*: Node-link graph with drag/click
 - \*\*What-If Merge Simulator\*\*: Drag-and-drop merge queue
 - \*\*Risk Heatmap\*\*: Grid showing all PR pairs
 - \*\*Merge Order List\*\*: Step-by-step sequence
 - \*\*File Drill-Down\*\*: Click to see conflicting files/lines

### Phase 7: Verification (Optional Demo)

1. User clicks "Verify Prediction"
2. Backend clones the repo locally
3. Uses \`git merge-tree\` to simulate merging in the suggested order
4. Confirms: No conflicts (prediction was correct)
5. Then tries wrong order → Shows conflict

---

## 🎨 Frontend Pages & Features

### Page 1: Input Page

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 🔀 MergeGuard │
│ Predict Pull Request Conflicts Before They Happen │
├─────────────────────────────────────────────────────────────┤
│ │
│ GitHub Repository URL: │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://github.com/psf/requests │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ \[ Analyze Repository \] │
│ │
│ Recent Analyses: │
│ • psf/requests (5 PRs, 3 high-risk pairs) │
│ • pallets/flask (12 PRs, 8 high-risk pairs) │
│ │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Page 2: Results Dashboard

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 📊 Analysis: psf/requests │
├─────────────────────────────────────────────────────────────┤
│ │
│ \[ Conflict Graph \] \[ Heatmap \] \[ Merge Order \] │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CONFLICT GRAPH (Interactive) │ │
│ │ │ │
│ │ PR#3 │ │
│ │ \| │ │
│ │ (safe) │ │
│ │ \| │ │
│ │ PR#1 ──🔴── PR#2 │ │
│ │ \\ / │ │
│ │ \\🟡 /🟡 │ │
│ │ \\ / │ │
│ │ PR#4 │ │
│ │ │ │
│ │ \[Drag nodes to explore\] \[Click for details\] │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ 📋 RECOMMENDED MERGE ORDER │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. Merge PR #3 (no conflicts) ✅ │ │
│ │ 2. Merge PR #5 (no conflicts) ✅ │ │
│ │ 3. Merge PR #1 (low risk) ✅ │ │
│ │ 4. Rebase PR #4 after #1 ⚠️ │ │
│ │ 5. Merge PR #2 (high risk with #1) 🔴 │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ 🔄 WHAT-IF MERGE SIMULATOR │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ MERGE QUEUE: \[PR #3\] → \[PR #1\] → \[???\] → \[???\] │ │
│ │ │ │
│ │ Available: \[#2, #4, #5\] │ │
│ │ Drag one into the queue → │ │
│ │ │ │
│ │ Current Conflict Risk: 12% ✅ │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ 🔍 FILE DRILL-DOWN │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ PR #1 ↔ PR #2 (87% conflict) │ │
│ │ │ │
│ │ 📁 auth.py ← CONFLICT │ │
│ │ Lines 45-67 (PR #1) overlaps with 52-70 (PR #2) │ │
│ │ │ │
│ │ PR #1 (@alice): PR #2 (@bob): │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ │ def validate(): │ │ def validate(): │ │ │
│ │ │ if not token: │ │ if token None:│ │ │
│ │ │ return False│ │ raise Error │ │ │
│ │ └─────────────────┘ └─────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ 📊 Model Confidence: 84% │
│ │
│ \[ Export Report \] \[ Verify Prediction \] │
│ │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📥 Inputs Required

\| Input \| Format \| Source \|
\|-------\|--------\|--------\|
\| \*\*Repository URL\*\* \| String \| Any public GitHub repo \|
\| \*\*PR Numbers\*\* \| List of integers \| Open PRs in that repo \|
\| \*\*Historical Merge Data\*\* \| JSON/CSV \| Past merges in same repo (for training) \|
\| \*\*Configuration\*\* \| JSON/YAML \| Optional: thresholds, weights \|

---

## 📤 Outputs Produced

\| Output \| Format \| Description \|
\|--------\|--------\|-------------\|
\| \*\*Conflict Report\*\* \| Text/CLI \| List of PR pairs with probability scores \|
\| \*\*Risk Categories\*\* \| Labels \| High / Moderate / Low \|
\| \*\*Merge Order Recommendation\*\* \| Text \| Optimal sequence to avoid conflicts \|
\| \*\*Confidence Score\*\* \| Float (0–1) \| Model confidence per prediction \|
\| \*\*Visual Heatmap\*\* \| PNG/HTML \| PR-to-PR conflict risk map \|
\| \*\*Interactive Conflict Graph\*\* \| HTML/JS \| Node-link graph of PR relationships \|
\| \*\*What-If Simulator\*\* \| Interactive UI \| Drag-and-drop merge queue \|
\| \*\*File-Level Diffs\*\* \| HTML \| Side-by-side comparison of conflicting files \|
\| \*\*JSON Report\*\* \| JSON \| Machine-readable for CI/CD \|
\| \*\*File-Level Details\*\* \| Text \| Which files cause the risk \|

---

## 📁 Project Structure

\`\`\`
mergeguard/
├── backend/
│ ├── src/
│ │ ├── github/
│ │ │ ├── api\_client.py # GitHub API wrapper
│ │ │ └── pr\_fetcher.py # Fetch PR data
│ │ ├── features/
│ │ │ ├── file\_overlap.py # File overlap computation
│ │ │ ├── line\_overlap.py # Line-level overlap
│ │ │ ├── module\_overlap.py # Module-level overlap
│ │ │ └── history.py # Historical conflict patterns
│ │ ├── model/
│ │ │ ├── bayesian\_network.py # pyAgrum model
│ │ │ ├── train.py # Training script
│ │ │ └── predict.py # Inference engine
│ │ ├── planning/
│ │ │ └── merge\_order.py # Optimal merge sequence
│ │ ├── verification/
│ │ │ ├── merge\_simulator.py # git merge-tree
│ │ │ └── diff\_analyzer.py # File diff extraction
│ │ ├── report/
│ │ │ ├── generator.py # Report generation
│ │ │ └── visualizer.py # Heatmaps and charts
│ │ ├── api/
│ │ │ ├── routes.py # Flask endpoints
│ │ │ └── models.py # SQLAlchemy models
│ │ └── cli.py # Command-line interface
│ ├── data/
│ │ ├── historical/ # Past merge data
│ │ └── cache/ # Cached PR data
│ ├── outputs/
│ │ ├── reports/ # Generated reports
│ │ └── visualizations/ # Heatmaps
│ ├── tests/
│ │ ├── test\_github.py
│ │ ├── test\_features.py
│ │ └── test\_model.py
│ ├── requirements.txt
│ └── setup.py
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── RepoInput.tsx # URL input
│ │ │ ├── ConflictGraph.tsx # D3.js graph
│ │ │ ├── Heatmap.tsx # Risk heatmap
│ │ │ ├── MergeSimulator.tsx # Drag-and-drop
│ │ │ ├── FileDrillDown.tsx # Diff viewer
│ │ │ └── MergeOrderList.tsx # Sequence display
│ │ ├── pages/
│ │ │ ├── Home.tsx
│ │ │ └── Results.tsx
│ │ ├── services/
│ │ │ └── api.ts # API calls
│ │ ├── App.tsx
│ │ └── main.tsx
│ ├── package.json
│ ├── tailwind.config.js
│ └── vite.config.ts
├── docs/
│ └── README.md
└── docker-compose.yml (optional)
\`\`\`

---

## 🗓️ Week-by-Week Development Plan

### Week 1: Setup + GitHub Integration

\| Day \| Task \| Deliverable \|
\|-----\|------\|-------------\|
\| 1 \| Set up project structure, install dependencies \| Working Python env \|
\| 2 \| Build GitHub API client \| \`fetch\_prs(repo\_url)\` works \|
\| 3 \| Test with 2-3 public repos \| Data flows correctly \|
\| 4 \| Design SQLite schema \| Tables created \|
\| 5 \| Store PR data in database \| Data persists \|
\| 6-7 \| Build CLI to list PRs \| \`python cli.py list --repo URL\` \|

\*\*Milestone:\*\* Can fetch and display open PRs from any public repo.

---

### Week 2: Feature Extraction

\| Day \| Task \| Deliverable \|
\|-----\|------\|-------------\|
\| 1 \| Implement file overlap \| \`file\_overlap(pr\_a, pr\_b)\` \|
\| 2 \| Implement line overlap \| \`line\_overlap(pr\_a, pr\_b)\` \|
\| 3 \| Implement module overlap \| \`module\_overlap(pr\_a, pr\_b)\` \|
\| 4 \| Build feature extraction pipeline \| All features computed for all pairs \|
\| 5 \| Store features in database \| Features persist \|
\| 6-7 \| Test with 5+ repos \| Verify feature correctness \|

\*\*Milestone:\*\* Can compute all overlap features for any PR pair.

---

### Week 3: Historical Data Collection

\| Day \| Task \| Deliverable \|
\|-----\|------\|-------------\|
\| 1 \| Build historical merge fetcher \| Get past merged PRs \|
\| 2 \| Simulate merges with \`git merge-tree\` \| Determine if conflict occurred \|
\| 3 \| Build labeled dataset \| \`(features, did\_conflict)\` pairs \|
\| 4 \| Collect from 10+ repos \| 500+ training samples \|
\| 5 \| Store historical data in database \| Training data ready \|
\| 6-7 \| Exploratory data analysis \| Understand patterns \|

\*\*Milestone:\*\* Have a labeled dataset of past merges and their outcomes.

---

### Week 4: Bayesian Model

\| Day \| Task \| Deliverable \|
\|-----\|------\|-------------\|
\| 1 \| Define Bayesian Network structure \| Nodes and arcs defined \|
\| 2 \| Learn CPTs from training data \| Model trained \|
\| 3 \| Build inference engine \| \`predict\_conflict(features)\` \|
\| 4 \| Evaluate accuracy \| >75% accuracy \|
\| 5 \| Tune thresholds \| Optimize performance \|
\| 6-7 \| Test on unseen repos \| Validate generalization \|

\*\*Milestone:\*\* Working Bayesian model that predicts conflicts.

---

### Week 5: Merge Order + Reporting + Verification

\| Day \| Task \| Deliverable \|
\|-----\|------\|-------------\|
\| 1 \| Build merge order planner \| Optimal sequence algorithm \|
\| 2 \| Build merge simulator \| \`git merge-tree\` verification \|
\| 3 \| Build report generator \| Text/JSON reports \|
\| 4 \| Build CLI commands \| \`predict\`, \`report\`, \`order\`, \`verify\` \|
\| 5 \| Build visualization (heatmap) \| Matplotlib heatmap \|
\| 6-7 \| Documentation \| README + docs \|

\*\*Milestone:\*\* Complete CLI tool with reporting and verification.

---

### Week 6: Frontend + Demo

\| Day \| Task \| Deliverable \|
\|-----\|------\|-------------\|
\| 1 \| Build Flask API \| REST endpoints \|
\| 2 \| Build React frontend (input page) \| URL input works \|
\| 3 \| Build Conflict Graph (D3.js) \| Interactive graph \|
\| 4 \| Build What-If Simulator \| Drag-and-drop merge queue \|
\| 5 \| Build File Drill-Down \| Side-by-side diff viewer \|
\| 6 \| Prepare demo script \| 15-min presentation \|
\| 7 \| Practice + polish \| Demo ready \|

\*\*Milestone:\*\* Complete working system with frontend and demo.

---

## 🎯 Success Criteria

\| Criterion \| Target \|
\|-----------\|--------\|
\| \*\*Fetches PRs\*\* \| Successfully pulls data from any public repo \|
\| \*\*Extracts Features\*\* \| Computes overlap metrics for all PR pairs \|
\| \*\*Trains Model\*\* \| Bayesian model trains in under 30 seconds \|
\| \*\*Predicts Conflicts\*\* \| Achieves >75% accuracy on test set \|
\| \*\*Recommends Merge Order\*\* \| Produces valid order that avoids conflicts \|
\| \*\*Generates Report\*\* \| Shows file, probability, risk level \|
\| \*\*Visualizes\*\* \| Interactive graph + heatmap + drill-down \|
\| \*\*Verifies Prediction\*\* \| \`git merge-tree\` matches model prediction \|

---

## 💼 Resume Value

\| Skill Demonstrated \| Why It Matters \|
\|--------------------\|----------------\|
\| \*\*GitHub API Integration\*\* \| Real-world API usage \|
\| \*\*Bayesian Modeling\*\* \| Core AI skill \|
\| \*\*Feature Engineering\*\* \| Critical for ML/AI roles \|
\| \*\*Git Internals\*\* \| Understanding merge mechanics \|
\| \*\*Planning Algorithms\*\* \| Merge order optimization \|
\| \*\*Full Stack Development\*\* \| React + Flask + SQLite \|
\| \*\*Interactive Visualization\*\* \| D3.js + drag-and-drop \|
\| \*\*Data Collection\*\* \| Working with real repository data \|
\| \*\*Tool Building\*\* \| Creating useful developer tools \|

\*\*Resume Impact: ⭐⭐⭐⭐⭐\*\*

---

## 🎬 Demo Plan Summary

\| Part \| What You Show \| Time \|
\|------\|---------------\|------\|
\| \*\*Problem\*\* \| Why conflicts waste time \| 2 min \|
\| \*\*Solution\*\* \| The tool and pipeline \| 1 min \|
\| \*\*Live Demo\*\* \| Fetch PRs, show graph, simulate merges, verify \| 8 min \|
\| \*\*Technical\*\* \| Bayesian Network + features \| 3 min \|
\| \*\*Results\*\* \| Accuracy metrics \| 1 min \|
\| \*\*Total\*\* \| \| \*\*15 min\*\* \|

---

## 🧠 Bayesian Network — Clarified

### What "Trained" Means

\*\*Training = filling in probability tables.\*\*

Without training, the network is empty. It doesn't know:
- "If file overlap is HIGH, what's the chance of conflict?"
- "If history rate is LOW, what's the chance of conflict?"

\*\*Training means:\*\* You show the network thousands of examples:
\`\`\`
Example 1: File Overlap=High, Line Overlap=High, History=High → Conflict=YES
Example 2: File Overlap=Low, Line Overlap=Low, History=Low → Conflict=NO
... (5000 more examples)
\`\`\`

The network learns:
- "When File Overlap is High, 78% of the time there's a conflict"
- "When History is Low, only 12% of the time there's a conflict"

### Do You Need a GPU?

\*\*No.\*\* Bayesian Networks use simple probability math, not deep learning.

\| What You DON'T Need \| Why \|
\|---------------------\|-----\|
\| \*\*No GPU\*\* \| Bayesian Networks are not neural networks \|
\| \*\*No large model\*\* \| 5-10 nodes, just tables of numbers \|
\| \*\*No cloud\*\* \| Runs on your 8GB M1 MacBook \|
\| \*\*No hours of training\*\* \| Takes seconds \|

### What Training Looks Like in Code

\`\`\`python
# Step 1: Define network structure
bn = gum.BayesNet('MergeConflict')
bn.add(gum.LabelizedVariable('file\_overlap', '', \['Low', 'Medium', 'High'\]))
bn.add(gum.LabelizedVariable('line\_overlap', '', \['Low', 'Medium', 'High'\]))
bn.add(gum.LabelizedVariable('history\_rate', '', \['Low', 'Medium', 'High'\]))
bn.add(gum.LabelizedVariable('conflict', '', \['No', 'Yes'\]))

bn.addArc('file\_overlap', 'conflict')
bn.addArc('line\_overlap', 'conflict')
bn.addArc('history\_rate', 'conflict')

# Step 2: Learn probabilities from data (THIS is "training")
bn.fit(df) # df = your 5000 historical examples
# Done in seconds.

# Step 3: Predict
ie = gum.LazyPropagation(bn)
ie.setEvidence({'file\_overlap': 'High', 'line\_overlap': 'Medium'})
ie.makeInference()
print(ie.posterior('conflict')) # → \[0.13, 0.87\] meaning 87% conflict
\`\`\`

\*\*Total training time: <5 seconds on your M1 MacBook.\*\*

---

## 📊 Final Checklist

\| Item \| Status \|
\|------\|--------\|
\| Project Title \| ✅ \|
\| Description \| ✅ \|
\| Feature List \| ✅ \|
\| System Architecture \| ✅ \|
\| Tech Stack \| ✅ \|
\| Database Schema \| ✅ \|
\| Algorithms (Syllabus) \| ✅ \|
\| Execution Flow \| ✅ \|
\| Frontend Pages \| ✅ \|
\| Inputs/Outputs \| ✅ \|
\| Project Structure \| ✅ \|
\| Week-by-Week Plan \| ✅ \|
\| Success Criteria \| ✅ \|
\| Resume Value \| ✅ \|
\| Demo Plan \| ✅ \|
\| Bayesian Explanation \| ✅ \|

---

\*\*This is the complete, updated plan. Ready to start Week 1?\*\*