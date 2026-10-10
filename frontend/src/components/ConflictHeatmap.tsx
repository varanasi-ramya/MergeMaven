// Conflict Heatmap component for PR vs PR conflict probability matrix on light background.

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HeatmapData {
  prs: {
    number: number
    title: string
    author: string
  }[]
  matrix: number[][]
}

interface HeatmapProps {
  data: HeatmapData
  onCellClick?: (prA: number, prB: number, probability: number) => void
}

export function ConflictHeatmap({ data, onCellClick }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ prA: number; prB: number; value: number } | null>(null)

  const getCellBg = (value: number) => {
    if (value >= 0.7) return 'bg-burgundy text-white font-bold shadow-sm'
    if (value >= 0.4) return 'bg-brown-accent text-white font-semibold shadow-sm'
    if (value >= 0.2) return 'bg-card-elevated text-brown-deep font-semibold border border-border'
    if (value > 0) return 'bg-card text-sand font-medium'
    return 'bg-transparent text-sand/30'
  }

  const getRiskLabel = (value: number) => {
    if (value >= 0.7) return 'HIGH'
    if (value >= 0.4) return 'MODERATE'
    if (value >= 0.2) return 'LOW'
    return 'MINIMAL'
  }

  return (
    <Card className="bg-card border-border overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base text-burgundy font-bold">Conflict Matrix Heatmap</CardTitle>
            <CardDescription className="text-xs font-mono text-sand">
              PR collision probabilities across all pairwise combinations
            </CardDescription>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-sand font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-burgundy shadow-sm" />
              <span className="font-semibold text-foreground">High ({'>'}70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-brown-accent shadow-sm" />
              <span>Mod (40-70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-card-elevated border border-border" />
              <span>Low (20-40%)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="w-20 p-2 text-left font-mono text-[11px] text-sand uppercase font-bold">
                  PR
                </th>
                {data.prs.map((pr) => (
                  <th
                    key={pr.number}
                    className="w-16 p-2 text-center font-mono text-xs font-bold text-burgundy"
                  >
                    #{pr.number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row, i) => (
                <tr key={i} className="hover:bg-card-elevated/40 transition-colors">
                  <td className="p-2 font-bold text-burgundy border-r border-border">
                    #{data.prs[i].number}
                  </td>
                  {row.map((val, j) => {
                    const isDiagonal = i === j
                    const displayVal = isDiagonal ? '-' : `${Math.round(val * 100)}%`

                    return (
                      <td key={j} className="p-1 text-center">
                        <div
                          onClick={() => !isDiagonal && onCellClick?.(data.prs[i].number, data.prs[j].number, val)}
                          onMouseEnter={() => !isDiagonal && setHoveredCell({ prA: data.prs[i].number, prB: data.prs[j].number, value: val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`h-9 w-full rounded-md flex items-center justify-center font-mono text-xs transition-all duration-150 ${
                            isDiagonal
                              ? 'bg-transparent text-sand/30 cursor-default'
                              : `${getCellBg(val)} cursor-pointer hover:scale-105 hover:shadow-md`
                          }`}
                        >
                          {displayVal}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover info pill */}
        {hoveredCell && (
          <div className="mt-4 p-3 rounded-xl bg-card-elevated border border-border flex items-center justify-between text-xs font-mono shadow-sm">
            <span className="font-bold text-burgundy">
              PR #{hoveredCell.prA} ↔ PR #{hoveredCell.prB}
            </span>
            <span className="text-foreground">
              Risk: <strong className="text-burgundy font-bold">{getRiskLabel(hoveredCell.value)}</strong> ({Math.round(hoveredCell.value * 100)}%)
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}