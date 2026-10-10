// Conflict list component displaying PR conflicts with risk assessment.

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
}

export function ConflictList({ conflicts, onSelectConflict }: ConflictListProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-900/50 text-red-300 border-red-700'
      case 'MODERATE':
        return 'bg-amber-900/50 text-amber-300 border-amber-700'
      case 'LOW':
        return 'bg-green-900/50 text-green-300 border-green-700'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700'
    }
  }

  const getRiskLabel = (risk: string) => {
    return risk.charAt(0) + risk.slice(1).toLowerCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-mono font-semibold text-foreground">
          High-Risk Conflicts
        </h2>
        <div className="text-sm text-muted-foreground font-mono">
          {conflicts.length} conflicts
        </div>
      </div>

      {conflicts.map((conflict) => (
        <Card
          key={conflict.id}
          className={`cursor-pointer transition-all hover:scale-[1.02] ${getRiskColor(conflict.riskLevel)} border`}
          onClick={() => onSelectConflict?.(conflict)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="font-mono text-foreground mb-1">
                  PR #{conflict.prA.number} ↔ PR #{conflict.prB.number}
                </CardTitle>
                <CardDescription className="font-mono text-muted-foreground text-sm">
                  {conflict.prA.title} & {conflict.prB.title}
                </CardDescription>
              </div>
              <Badge className={`${getRiskColor(conflict.riskLevel)} font-mono`}>               
                {getRiskLabel(conflict.riskLevel)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">PROBABILITY</div>
                <div className="text-lg font-mono font-bold text-foreground">
                  {conflict.conflictProbability > 0.99 ? '>99%' : `${(conflict.conflictProbability * 100).toFixed(0)}%`}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">SHARED FILES</div>
                <div className="text-lg font-mono font-bold text-foreground">
                  {conflict.sharedFiles}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">SHARED LINES</div>
                <div className="text-lg font-mono font-bold text-foreground">
                  {conflict.sharedLines}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">CONFIDENCE</div>
                <div className="text-lg font-mono font-bold text-foreground">
                  {(conflict.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs font-mono text-muted-foreground">
                @{conflict.prA.author} ↔ @{conflict.prB.author}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                Authors: {conflict.prA.author}, {conflict.prB.author}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {conflicts.length === 0 && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-lg font-mono text-muted-foreground mb-2">
                No high-risk conflicts found
              </div>
              <div className="text-sm font-mono text-muted-foreground/70">
                All PR pairs appear to be low risk.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}