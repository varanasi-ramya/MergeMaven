// Conflict list component displaying PR conflicts with risk assessment on light background.

import { useState } from 'react'
import { ArrowLeftRight, Search, ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface Conflict {
  id: string
  prA: {
    number: number
    title: string
    author: string
    filesChanged: number
  }
  prB: {
    number: number
    title: string
    author: string
    filesChanged: number
  }
  conflictProbability: number
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
  sharedFiles: number
  sharedLines: number
  confidence: number
}

interface ConflictListProps {
  conflicts: Conflict[]
  onSelectConflict?: (conflict: Conflict) => void
  selectedConflictId?: string | null
}

export function ConflictList({ conflicts, onSelectConflict, selectedConflictId }: ConflictListProps) {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredConflicts = conflicts.filter((c) => {
    const matchesFilter = filter === 'ALL' || c.riskLevel === filter
    const matchesSearch =
      searchQuery === '' ||
      c.prA.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.prB.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.prA.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.prB.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.prA.number.toString().includes(searchQuery) ||
      c.prB.number.toString().includes(searchQuery)
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border shadow-sm">
          {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => {
            const count = lvl === 'ALL' ? conflicts.length : conflicts.filter((c) => c.riskLevel === lvl).length
            const isActive = filter === lvl
            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-burgundy text-cream shadow-sm font-semibold'
                    : 'text-sand hover:text-burgundy hover:bg-card-elevated'
                }`}
              >
                <span>{lvl.charAt(0) + lvl.slice(1).toLowerCase()}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sand" />
          <Input
            placeholder="Filter PRs, authors, titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-card border-border shadow-sm text-foreground placeholder:text-sand/60"
          />
        </div>
      </div>

      {/* Conflict Items List */}
      <div className="space-y-3">
        {filteredConflicts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-card border border-border p-6 shadow-sm">
            <p className="text-sm font-mono text-sand">No conflicts found matching current filter.</p>
          </div>
        ) : (
          filteredConflicts.map((conflict) => {
            const isSelected = selectedConflictId === conflict.id
            const probPct = Math.round(conflict.conflictProbability * 100)

            return (
              <div
                key={conflict.id}
                onClick={() => onSelectConflict?.(conflict)}
                className={`group p-5 rounded-2xl bg-card border transition-all duration-200 cursor-pointer card-hover-glow shadow-sm ${
                  isSelected
                    ? 'border-burgundy bg-card-elevated shadow-md ring-2 ring-burgundy/30'
                    : 'border-border hover:border-burgundy/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: PR Pair & Details */}
                  <div className="flex-1 space-y-2.5">
                    {/* PR Pills & Risk Badge */}
                    <div className="flex items-center flex-wrap gap-2.5">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-card-elevated border border-border">
                        <span className="font-mono text-xs font-bold text-burgundy">
                          PR #{conflict.prA.number}
                        </span>
                        <span className="text-[10px] font-mono text-sand">
                          @{conflict.prA.author}
                        </span>
                      </div>

                      <ArrowLeftRight className="w-3.5 h-3.5 text-sand" />

                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-card-elevated border border-border">
                        <span className="font-mono text-xs font-bold text-brown-deep">
                          PR #{conflict.prB.number}
                        </span>
                        <span className="text-[10px] font-mono text-sand">
                          @{conflict.prB.author}
                        </span>
                      </div>

                      <Badge variant={getRiskBadgeVariant(conflict.riskLevel) as any} className="ml-auto md:ml-0 text-[10px]">
                        {conflict.riskLevel} RISK
                      </Badge>
                    </div>

                    {/* Titles */}
                    <div className="text-xs font-sans text-foreground line-clamp-1 group-hover:text-burgundy transition-colors font-medium">
                      <span>{conflict.prA.title}</span>
                      <span className="text-sand mx-2">vs</span>
                      <span>{conflict.prB.title}</span>
                    </div>
                  </div>

                  {/* Right: Metrics & Gauge */}
                  <div className="flex items-center gap-6 self-end md:self-center shrink-0 border-t md:border-t-0 border-border/40 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-left font-mono">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-sand font-semibold">
                          Shared Files
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {conflict.sharedFiles}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-sand font-semibold">
                          Shared Lines
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {conflict.sharedLines}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-sand font-semibold">
                          Confidence
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {Math.round(conflict.confidence * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Probability Gauge & Action */}
                    <div className="flex items-center gap-3 pl-2 border-l border-border">
                      <div className="text-right font-mono">
                        <div className="text-[10px] uppercase tracking-wider text-sand font-semibold">
                          Probability
                        </div>
                        <div className="text-lg font-bold text-burgundy">
                          {probPct}%
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-sand group-hover:text-burgundy group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}