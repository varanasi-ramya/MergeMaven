// Main application — wires real backend data into the dashboard.

import { useState, useCallback } from 'react'
import {
  GitPullRequest,
  GitMerge,
  Sliders,
  Sparkles,
  Network,
  Grid3X3,
  RefreshCw,
  Home,
  AlertTriangle,
} from 'lucide-react'

import { Logo } from './components/Logo'
import { Landing } from './components/Landing'
import { ConflictDetail } from './components/ConflictDetail'
import { ConflictGraph } from './components/ConflictGraph'
import { ConflictHeatmap } from './components/ConflictHeatmap'
import { MergeOrder } from './components/MergeOrder'
import { WhatIfSimulator } from './components/WhatIfSimulator'
import { FileDrillDown } from './components/FileDrillDown'
import { Verification } from './components/Verification'
import { AnalysisConfig } from './components/AnalysisConfig'
import { Button } from './components/ui/button'
import { analyzeRepo, type AnalyzeResult, type ConflictPrediction } from './api'

type MainView = 'conflicts' | 'graph' | 'matrix' | 'planner' | 'simulator'

// Build graph nodes & links from live conflict predictions
function buildGraphData(conflicts: ConflictPrediction[]) {
  const nodeMap = new Map<number, { id: string; label: string; prNumber: number; riskLevel: 'HIGH' | 'MODERATE' | 'LOW'; conflictCount: number }>()

  for (const c of conflicts) {
    for (const pr of [c.prA, c.prB]) {
      if (!nodeMap.has(pr.number)) {
        nodeMap.set(pr.number, {
          id: String(pr.number),
          label: pr.title || `PR #${pr.number}`,
          prNumber: pr.number,
          riskLevel: c.riskLevel,
          conflictCount: 0,
        })
      }
      nodeMap.get(pr.number)!.conflictCount++
    }
  }

  const nodes = Array.from(nodeMap.values())
  const links = conflicts.map((c) => ({
    source: String(c.prA.number),
    target: String(c.prB.number),
    probability: c.conflictProbability,
    riskLevel: c.riskLevel,
  }))
  return { nodes, links }
}

// Build heatmap matrix from live conflicts
function buildHeatmapData(conflicts: ConflictPrediction[]) {
  const prNumbers = Array.from(
    new Set(conflicts.flatMap((c) => [c.prA.number, c.prB.number]))
  ).sort((a, b) => a - b)

  const prMap = new Map<number, { number: number; title: string; author: string }>()
  for (const c of conflicts) {
    prMap.set(c.prA.number, { number: c.prA.number, title: c.prA.title, author: c.prA.author })
    prMap.set(c.prB.number, { number: c.prB.number, title: c.prB.title, author: c.prB.author })
  }

  const prs = prNumbers.map((n) => prMap.get(n)!)

  const probMap = new Map<string, number>()
  for (const c of conflicts) {
    const key = `${Math.min(c.prA.number, c.prB.number)}-${Math.max(c.prA.number, c.prB.number)}`
    probMap.set(key, c.conflictProbability)
  }

  const matrix = prNumbers.map((a) =>
    prNumbers.map((b) => {
      if (a === b) return 0
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`
      return probMap.get(key) ?? 0
    })
  )

  return { prs, matrix }
}

export default function App() {
  const [activeRepo, setActiveRepo] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null)

  const [currentView, setCurrentView] = useState<MainView>('conflicts')
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedDrillDownFile, setSelectedDrillDownFile] = useState<any | null>(null)

  const runAnalysis = useCallback(async (repoUrl: string) => {
    setIsAnalyzing(true)
    setAnalyzeError(null)
    try {
      const result = await analyzeRepo(repoUrl)
      setAnalysisResult(result)
      setActiveRepo(repoUrl)
      setSelectedConflictId(result.conflicts[0]?.id ?? null)
      setCurrentView('conflicts')
    } catch (err: any) {
      setAnalyzeError(err.message || 'Analysis failed. Is the backend running?')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // ── LANDING ────────────────────────────────────────────────────────────────
  if (!activeRepo) {
    return (
      <>
        <Landing onAnalyze={runAnalysis} isLoading={isAnalyzing} error={analyzeError} />
      </>
    )
  }

  // ── DASHBOARD DATA ─────────────────────────────────────────────────────────
  const conflicts = analysisResult?.conflicts ?? []
  const selectedConflict = conflicts.find((c) => c.id === selectedConflictId) ?? conflicts[0]
  const { nodes: graphNodes, links: graphLinks } = buildGraphData(conflicts)
  const heatmapData = buildHeatmapData(conflicts)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-burgundy selection:text-white">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <Logo size={48} className="shadow-md" />
              <div className="flex flex-col">
                <span className="text-lg font-sans font-bold tracking-tight text-burgundy leading-tight">
                  MergeMaven
                </span>
                <span className="text-[11px] font-mono text-sand truncate max-w-[240px]" title={activeRepo}>
                  {activeRepo.replace('https://github.com/', '')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Status pill */}
              <div className="text-xs font-mono text-sand hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border shadow-sm">
                <span className="w-2 h-2 rounded-full bg-burgundy animate-pulse" />
                <span className="font-semibold text-foreground">{conflicts.length} conflicts</span>
                <span className="text-sand/70">· {analysisResult?.pr_count ?? 0} PRs</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVerifyModal(true)}
                className="h-8 text-xs font-mono text-foreground hover:text-burgundy border-border hover:bg-card-elevated shadow-sm"
              >
                <GitMerge className="w-3.5 h-3.5 mr-1.5 text-burgundy" />
                Verify Merge
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConfigModal(true)}
                title="Configuration"
                className="h-8 w-8 text-sand hover:text-burgundy hover:bg-card-elevated"
              >
                <Sliders className="w-4 h-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => runAnalysis(activeRepo)}
                disabled={isAnalyzing}
                className="h-8 text-xs font-mono shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing…' : 'Re-Analyze'}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setActiveRepo(null); setAnalysisResult(null) }}
                title="Change repository"
                className="h-8 w-8 text-sand hover:text-burgundy hover:bg-card-elevated"
              >
                <Home className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-border pb-1 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2">
            {[
              { id: 'conflicts', label: 'Conflict Analysis', icon: GitPullRequest },
              { id: 'graph',    label: 'Conflict Graph',    icon: Network },
              { id: 'matrix',   label: 'Heatmap Matrix',    icon: Grid3X3 },
              { id: 'planner',  label: 'Merge Sequence',    icon: GitMerge },
              { id: 'simulator',label: 'What-If Simulator', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = currentView === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as MainView)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-card border border-border text-burgundy shadow-sm font-bold ring-1 ring-burgundy/20'
                      : 'text-sand hover:text-burgundy hover:bg-card-elevated/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-burgundy' : 'text-sand'}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty state when no conflicts */}
        {conflicts.length === 0 && currentView === 'conflicts' && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-lg font-semibold text-foreground">No conflicts detected</p>
            <p className="text-sm font-mono text-sand">{analysisResult?.message ?? 'All open PRs appear safe to merge.'}</p>
          </div>
        )}

        {/* Conflict Analysis view */}
        {currentView === 'conflicts' && conflicts.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-semibold pl-2">
                  CONFLICT PAIR:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {conflicts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConflictId(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                        selectedConflictId === c.id
                          ? 'bg-burgundy text-cream font-semibold shadow-md ring-1 ring-burgundy/50'
                          : 'text-foreground hover:text-burgundy bg-card-elevated border border-border'
                      }`}
                    >
                      PR #{c.prA.number} ⇄ #{c.prB.number}
                    </button>
                  ))}
                </div>
              </div>
              {selectedConflict && (
                <span className="text-xs font-mono text-sand font-medium text-right pr-2 whitespace-nowrap">
                  {(selectedConflict.conflictProbability * 100).toFixed(0)}% Conflict Probability
                </span>
              )}
            </div>

            {selectedConflict && (
              <ConflictDetail
                conflict={selectedConflict}
                onOpenFileDrillDown={(file) => setSelectedDrillDownFile(file)}
              />
            )}
          </div>
        )}

        {currentView === 'graph' && (
          <ConflictGraph
            nodes={graphNodes}
            links={graphLinks}
            onNodeClick={(node) => console.log('Node clicked', node)}
          />
        )}

        {currentView === 'matrix' && (
          <ConflictHeatmap
            data={heatmapData}
            onCellClick={(prA, prB, prob) =>
              console.log(`Pair: PR #${prA} vs PR #${prB} (${prob})`)
            }
          />
        )}

        {currentView === 'planner' && (
          <MergeOrder mergeOrder={analysisResult?.merge_order} />
        )}

        {currentView === 'simulator' && <WhatIfSimulator />}
      </main>

      {/* Modals */}
      {selectedDrillDownFile && selectedConflict && (
        <FileDrillDown
          file={selectedDrillDownFile}
          prA={selectedConflict.prA}
          prB={selectedConflict.prB}
          onClose={() => setSelectedDrillDownFile(null)}
        />
      )}

      {showVerifyModal && (
        <Verification onClose={() => setShowVerifyModal(false)} />
      )}

      {showConfigModal && (
        <AnalysisConfig
          repoUrl={activeRepo}
          onSave={(cfg) => { if (cfg.repoUrl) runAnalysis(cfg.repoUrl) }}
          onCancel={() => setShowConfigModal(false)}
        />
      )}
    </div>
  )
}