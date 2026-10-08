# MergeMaven

Predict pull request conflicts before they happen.

MergeMaven analyzes open Pull Requests from a GitHub repository, extracts structural and historical features, and uses a Bayesian Network to predict the probability that merging one PR will cause conflicts with another. It then recommends an optimal merge order to minimize conflicts, so teams can plan merges and avoid hours of wasted work.

## How It Works

1. Fetch open PR data from a GitHub repository (files changed, lines modified, authors, timestamps)
2. Extract overlap features between every pair of PRs (file overlap, line overlap, module overlap)
3. Analyze historical conflict patterns for the same files and modules
4. Run Bayesian inference to output conflict probability for each PR pair
5. Sort PR pairs by risk level (High / Moderate / Low)
6. Generate an optimal merge order to minimize conflicts
7. Visualize results with an interactive graph, heatmap, and file-level drill-down
8. Optionally verify predictions by simulating merges via git merge-tree

## Architecture

- Frontend: React 18 + TypeScript + Tailwind CSS, with D3.js for the conflict graph, React DnD for the what-if simulator, and Chart.js for heatmaps
- Backend: Flask 2.3+ REST API, using PyGithub for PR fetching, GitPython for git operations, and pyAgrum for the Bayesian Network
- Database: SQLite with SQLAlchemy for persistent storage of PR data, features, predictions, and historical merges

## Tech Stack

Backend: Python 3.10+, Flask, PyGithub, GitPython, pyAgrum, pandas, numpy, SQLite, SQLAlchemy, matplotlib, seaborn, click, pytest

Frontend: React 18, TypeScript, Tailwind CSS, Axios, D3.js, React DnD, Chart.js, React Diff Viewer, Vite

## Project Structure

mergeguard/
  backend/
    src/
      github/        # GitHub API wrapper and PR fetcher
      features/      # File, line, and module overlap computation
      model/         # Bayesian Network and inference engine
      planning/      # Merge order planner
      verification/  # git merge-tree simulator and diff analyzer
      report/        # Report generation and visualization
      api/           # Flask routes and SQLAlchemy models
    cli.py           # Command-line interface
  frontend/
    src/
      components/    # React components (ConflictGraph, Heatmap, etc.)
      pages/         # Home and Results pages
      services/      # API client
    package.json
    tailwind.config.js
    vite.config.ts
  docs/
    README.md

## Algorithms

- Bayesian Networks: belief network construction for conflict probability
- Bayes' Rule: posterior inference given new PR data
- Decision Trees: risk classification (High/Moderate/Low)
- A* heuristic: shortest path between conflicting file changes
- Topological Sort + Greedy: optimal merge order planning
- Rule-based filtering: propositional logic for fast pre-filtering

## Inputs and Outputs

Inputs: GitHub repository URL, open PR numbers, historical merge data (JSON/CSV), optional configuration (JSON/YAML)

Outputs: conflict report with probability scores, risk categories, merge order recommendation, confidence scores, visual heatmaps, interactive conflict graph, what-if simulator, file-level diffs, and JSON report for CI/CD integration

## Success Criteria

- Fetches PRs from any public repo
- Extracts overlap features for all PR pairs
- Bayesian model trains in under 30 seconds
- Predicts conflicts with greater than 75 percent accuracy
- Recommends a valid merge order that avoids conflicts
- Generates report with file, probability, and risk level
- Provides interactive graph, heatmap, and drill-down
- git merge-tree verification matches model prediction

## Development Plan

Six-week plan covering GitHub integration, feature extraction, historical data collection, Bayesian model, merge order and reporting, and frontend with demo.

## Resume Value

Demonstrates GitHub API integration, Bayesian modeling, feature engineering, git internals, planning algorithms, full-stack development, interactive visualization, data collection, and tool building.

## Current Status

**Week 1-5 Complete:** GitHub PR fetcher, SQLite schema, CLI (fetch/list/order/predict/report/build/verify/dataset), feature extraction, historical data collection, Bayesian model training and inference.

**Week 6 (Frontend):** React frontend with interactive conflict graph, what-if simulator, and file drill-down.

All 50 tests passing.
