// Conflict detail component showing comprehensive analysis of a PR conflict on light cream background.

import { useState } from 'react'
import { ArrowLeftRight, FileText, ShieldCheck, ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  ProbabilityGauge,
  OverlapDonut,
  FileOverlapBarChart,
  RiskTrendChart,
  HeatmapStrip,
  MiniSparkline,
  MiniRadial,
} from '@/components/VisualCharts'

interface ConflictDetailProps {
  conflict: {
    id: string
    prA: {
      number: number
      title: string
      author: string
      filesChanged: number
      branch?: string
      additions?: number
      deletions?: number
    }
    prB: {
      number: number
      title: string
      author: string
      filesChanged: number
      branch?: string
      additions?: number
      deletions?: number
    }
    conflictProbability: number
    riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
    sharedFiles: number
    sharedLines: number
    confidence: number
  }
  onOpenFileDrillDown?: (file: any) => void
}

export function ConflictDetail({ conflict, onOpenFileDrillDown }: ConflictDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'analysis'>('overview')

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'high'
      case 'MODERATE':
        return 'moderate'
      case 'LOW':
        return 'low'
      default:
        return 'default'
    }
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const mockSharedFiles = [
    { path: 'src/payments/checkout.ts', overlap: 0.85, lines: 64, conflictProb: 0.89 },
    { path: 'src/payments/processor.ts', overlap: 0.72, lines: 38, conflictProb: 0.75 },
    { path: 'src/payments/validation.ts', overlap: 0.41, lines: 14, conflictProb: 0.45 },
    { path: 'src/orders/service.ts', overlap: 0.23, lines: 8, conflictProb: 0.2 },
  ]

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* 2. PR Pair Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center flex-wrap gap-3">
          {/* PR A Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-card-elevated border border-border">
            <div className="w-6 h-6 rounded-full bg-burgundy flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm">
              {getInitials(conflict.prA.author)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-burgundy">
                PR #{conflict.prA.number}
              </span>
              <span className="text-[11px] font-mono text-sand truncate max-w-[140px]">
                {conflict.prA.title}
              </span>
            </div>
            <span className="text-[11px] font-mono text-sand/80 pl-1 border-l border-border">
              {conflict.prA.filesChanged} files
            </span>
          </div>

          {/* Swap Icon */}
          <div className="p-1 text-sand">
            <ArrowLeftRight className="w-4 h-4 text-burgundy" />
          </div>

          {/* PR B Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-card-elevated border border-border">
            <div className="w-6 h-6 rounded-full bg-brown-accent flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm">
              {getInitials(conflict.prB.author)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-brown-deep">
                PR #{conflict.prB.number}
              </span>
              <span className="text-[11px] font-mono text-sand truncate max-w-[140px]">
                {conflict.prB.title}
              </span>
            </div>
            <span className="text-[11px] font-mono text-sand/80 pl-1 border-l border-border">
              {conflict.prB.filesChanged} files
            </span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-bold">
            ASSESSED RISK:
          </span>
          <Badge variant={getRiskBadgeVariant(conflict.riskLevel) as any} className="px-3 py-1 text-xs">
            {conflict.riskLevel}
          </Badge>
        </div>
      </div>

      {/* 3. Stat Cards (4 in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Conflict Probability */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover-glow transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-semibold">
              CONFLICT PROBABILITY
            </span>
            <MiniRadial percent={Math.round(conflict.conflictProbability * 100)} />
          </div>
          <div className="text-3xl md:text-4xl font-mono font-bold text-burgundy tracking-tight">
            {(conflict.conflictProbability * 100).toFixed(0)}%
          </div>
          <div className="mt-2 text-[11px] font-mono text-sand font-medium">
            {conflict.riskLevel === 'HIGH' ? 'Elevated merge hazard' : 'Safe merge window'}
          </div>
        </div>

        {/* Card 2: Shared Files */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover-glow transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-semibold">
              SHARED FILES
            </span>
            <MiniSparkline values={[1, 2, 3, 2, 4, 3, conflict.sharedFiles]} color="#7D4F42" />
          </div>
          <div className="text-3xl md:text-4xl font-mono font-bold text-brown-deep tracking-tight">
            {conflict.sharedFiles}
          </div>
          <div className="mt-2 text-[11px] font-mono text-sand font-medium">
            Across payments & auth
          </div>
        </div>

        {/* Card 3: Shared Lines */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover-glow transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-semibold">
              SHARED LINES
            </span>
            <MiniSparkline values={[20, 45, 60, 85, 110, conflict.sharedLines]} color="#561C24" />
          </div>
          <div className="text-3xl md:text-4xl font-mono font-bold text-burgundy tracking-tight">
            {conflict.sharedLines}
          </div>
          <div className="mt-2 text-[11px] font-mono text-sand font-medium">
            Overlapping line changes
          </div>
        </div>

        {/* Card 4: Confidence */}
        <div className="p-5 rounded-2xl bg-card border border-border card-hover-glow transition-all duration-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-semibold">
              MODEL CONFIDENCE
            </span>
            <MiniRadial percent={Math.round(conflict.confidence * 100)} />
          </div>
          <div className="text-3xl md:text-4xl font-mono font-bold text-brown-deep tracking-tight">
            {(conflict.confidence * 100).toFixed(0)}%
          </div>
          <div className="mt-2 text-[11px] font-mono text-sand font-medium">
            Bayesian network score
          </div>
        </div>
      </div>

      {/* 4. Minimal Underline Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6">
          {(['overview', 'files', 'analysis'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-burgundy font-bold' : 'text-sand hover:text-burgundy'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {isActive && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-burgundy rounded-full transition-all duration-200" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 5. Tab Content */}
      <div className="mt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* PR Overview 2-Column Comparison Card */}
            <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-sans font-bold text-base text-burgundy">
                    PR Comparison
                  </h3>
                  <p className="text-xs font-mono text-sand mt-0.5">
                    Side-by-side branch & author scope
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Git Tree Diff
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Vertical Divider */}
                <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-border" />

                {/* Left Column: PR A */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-burgundy" />
                    <span className="font-mono text-xs font-bold text-burgundy">
                      PR #{conflict.prA.number}
                    </span>
                  </div>
                  <h4 className="font-sans font-semibold text-sm text-foreground leading-snug">
                    {conflict.prA.title}
                  </h4>
                  <div className="space-y-2 text-xs font-mono text-sand pt-2 border-t border-border/50">
                    <div className="flex justify-between">
                      <span className="text-sand/70">Author:</span>
                      <span className="text-foreground font-semibold">@{conflict.prA.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand/70">Files Changed:</span>
                      <span className="text-foreground font-semibold">{conflict.prA.filesChanged}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand/70">Branch:</span>
                      <span className="text-burgundy font-medium truncate max-w-[120px]">
                        {conflict.prA.branch || 'feature/payments-v2'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand/70">Status:</span>
                      <span className="text-foreground font-semibold">Open for review</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: PR B */}
                <div className="space-y-4 md:pl-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brown-accent" />
                    <span className="font-mono text-xs font-bold text-brown-deep">
                      PR #{conflict.prB.number}
                    </span>
                  </div>
                  <h4 className="font-sans font-semibold text-sm text-foreground leading-snug">
                    {conflict.prB.title}
                  </h4>
                  <div className="space-y-2 text-xs font-mono text-sand pt-2 border-t border-border/50">
                    <div className="flex justify-between">
                      <span className="text-sand/70">Author:</span>
                      <span className="text-foreground font-semibold">@{conflict.prB.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand/70">Files Changed:</span>
                      <span className="text-foreground font-semibold">{conflict.prB.filesChanged}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand/70">Branch:</span>
                      <span className="text-brown-accent font-medium truncate max-w-[120px]">
                        {conflict.prB.branch || 'refactor/txn-model'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sand/70">Status:</span>
                      <span className="text-foreground font-semibold">Approved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Analysis Card */}
            <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-6 space-y-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="font-sans font-bold text-base text-burgundy">
                  Risk Analysis
                </h3>
                <p className="text-xs font-mono text-sand mt-0.5">
                  Overlapping density metrics
                </p>
              </div>

              <div className="space-y-5">
                {/* File Overlap */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-sand font-medium">File Overlap</span>
                    <span className="text-burgundy font-bold">85%</span>
                  </div>
                  <div className="w-full bg-card-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brown-accent via-burgundy to-burgundy-light rounded-full transition-all duration-700 ease-out"
                      style={{ width: '85%' }}
                    />
                  </div>
                </div>

                {/* Line Overlap */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-sand font-medium">Line Overlap</span>
                    <span className="text-burgundy font-bold">72%</span>
                  </div>
                  <div className="w-full bg-card-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brown-accent via-burgundy to-burgundy-light rounded-full transition-all duration-700 ease-out"
                      style={{ width: '72%' }}
                    />
                  </div>
                </div>

                {/* Module Overlap */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-sand font-medium">Module Overlap</span>
                    <span className="text-brown-deep font-bold">41%</span>
                  </div>
                  <div className="w-full bg-card-elevated rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sand via-brown-accent to-burgundy rounded-full transition-all duration-700 ease-out"
                      style={{ width: '41%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Overlap Summary */}
              <div className="p-4 rounded-xl bg-card-elevated border border-border text-xs font-mono space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-burgundy font-bold">
                  <ShieldCheck className="w-4 h-4 text-burgundy" />
                  <span>Recommendation</span>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed font-medium">
                  Merge PR #{conflict.prB.number} first to minimize downstream rebase friction on checkout endpoints.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FILES */}
        {activeTab === 'files' && (
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-burgundy">
                  Shared Files
                </h3>
                <p className="text-xs font-mono text-sand mt-0.5">
                  Files modified concurrently by both PR #{conflict.prA.number} and PR #{conflict.prB.number}
                </p>
              </div>
              <span className="text-xs font-mono text-sand font-semibold">
                {mockSharedFiles.length} overlapping files
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border bg-card-elevated sticky top-0">
                    <th className="py-3.5 px-6 text-sand font-bold uppercase tracking-wider text-[11px]">
                      File Path
                    </th>
                    <th className="py-3.5 px-4 text-sand font-bold uppercase tracking-wider text-[11px]">
                      Overlap Density
                    </th>
                    <th className="py-3.5 px-4 text-sand font-bold uppercase tracking-wider text-[11px] text-right">
                      Shared Lines
                    </th>
                    <th className="py-3.5 px-4 text-sand font-bold uppercase tracking-wider text-[11px] text-center">
                      Impact
                    </th>
                    <th className="py-3.5 px-6 text-sand font-bold uppercase tracking-wider text-[11px] text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockSharedFiles.map((file, idx) => {
                    const pct = Math.round(file.overlap * 100)
                    const impactVariant = pct > 75 ? 'high' : pct > 40 ? 'moderate' : 'low'
                    return (
                      <tr
                        key={idx}
                        onClick={() => onOpenFileDrillDown?.(file)}
                        className="hover:bg-card-elevated/70 transition-colors duration-150 cursor-pointer group"
                      >
                        <td className="py-4 px-6 text-foreground font-semibold flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-burgundy group-hover:scale-110 transition-transform" />
                          <span>{file.path}</span>
                        </td>
                        <td className="py-4 px-4 min-w-[160px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-card-elevated h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-brown-accent to-burgundy rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-burgundy w-8 text-right font-bold">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-foreground font-semibold">
                          {file.lines} lines
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant={impactVariant as any} className="text-[10px] px-2 py-0.5">
                            {impactVariant.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] text-sand group-hover:text-burgundy font-medium transition-colors">
                            Inspect Diff
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Visuals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Semicircular Probability Gauge */}
              <div className="rounded-2xl bg-card border border-border p-6 flex flex-col justify-between shadow-sm">
                <div className="border-b border-border pb-3">
                  <h4 className="font-sans font-bold text-sm text-burgundy">
                    Conflict Probability Gauge
                  </h4>
                  <p className="text-[11px] font-mono text-sand">
                    Calculated via structural AST and commit proximity
                  </p>
                </div>
                <ProbabilityGauge
                  probability={conflict.conflictProbability}
                  size={200}
                  label="Likelihood of Conflict"
                />
                <div className="pt-3 border-t border-border flex justify-between text-xs font-mono text-sand font-medium">
                  <span>Confidence: {(conflict.confidence * 100).toFixed(0)}%</span>
                  <span>Risk: <strong className="text-burgundy">{conflict.riskLevel}</strong></span>
                </div>
              </div>

              {/* Overlap Donut */}
              <div className="rounded-2xl bg-card border border-border p-6 flex flex-col justify-between shadow-sm">
                <div className="border-b border-border pb-3">
                  <h4 className="font-sans font-bold text-sm text-burgundy">
                    Line Overlap Distribution
                  </h4>
                  <p className="text-[11px] font-mono text-sand">
                    Shared conflicting vs isolated modifications
                  </p>
                </div>
                <OverlapDonut
                  sharedLines={conflict.sharedLines}
                  prALines={142}
                  prBLines={98}
                  size={190}
                />
              </div>

              {/* Per-File Overlap Bar Chart */}
              <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
                <div className="border-b border-border pb-3">
                  <h4 className="font-sans font-bold text-sm text-burgundy">
                    File Overlap Breakdown
                  </h4>
                  <p className="text-[11px] font-mono text-sand">
                    Sorted by proportion of intersecting changes
                  </p>
                </div>
                <FileOverlapBarChart files={mockSharedFiles} />
              </div>

              {/* Risk Trend / Timeline */}
              <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
                <div className="border-b border-border pb-3">
                  <h4 className="font-sans font-bold text-sm text-burgundy">
                    Branch Divergence & Risk Trend
                  </h4>
                  <p className="text-[11px] font-mono text-sand">
                    Risk escalation over branch lifecycle
                  </p>
                </div>
                <RiskTrendChart />
              </div>
            </div>

            {/* Heatmap Strip Component */}
            <div className="rounded-2xl bg-card border border-border p-6 space-y-3 shadow-sm">
              <div className="border-b border-border pb-3">
                <h4 className="font-sans font-bold text-sm text-burgundy">
                  Line Range Collision Strip
                </h4>
                <p className="text-[11px] font-mono text-sand">
                  Heat intensity across `src/payments/checkout.ts` (lines 1 to 320)
                </p>
              </div>
              <HeatmapStrip />
            </div>

            {/* Plain-Language Summary Card */}
            <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-sans font-bold text-sm text-burgundy">
                    Plain-Language Analysis & Recommendations
                  </h4>
                  <p className="text-[11px] font-mono text-sand mt-0.5">
                    Automated contextual summary for development team
                  </p>
                </div>
                <Badge variant="moderate" className="text-[10px]">
                  AI Synthesized
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono text-foreground">
                <div className="space-y-2 p-4 rounded-xl bg-card-elevated border border-border">
                  <h5 className="font-bold text-burgundy">Root Cause</h5>
                  <p className="leading-relaxed text-sand text-[11px]">
                    Both pull requests independently modify transaction model definitions in `checkout.ts` and `processor.ts`, altering method signatures concurrently.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-card-elevated border border-border">
                  <h5 className="font-bold text-burgundy">Collision Areas</h5>
                  <p className="leading-relaxed text-sand text-[11px]">
                    High density collisions detected between lines 80-140 where authorization tokens and error handling dispatch are declared.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-card-elevated border border-border">
                  <h5 className="font-bold text-burgundy">Resolution Path</h5>
                  <p className="leading-relaxed text-sand text-[11px]">
                    Merge PR #{conflict.prB.number} into `main`, then run git rebase on PR #{conflict.prA.number} using standard 3-way merge strategy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}