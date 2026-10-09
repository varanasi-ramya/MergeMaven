"""Conflict Heatmap component for PR vs PR conflict probability matrix."""

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

const getColor = (value: number) => {
  if (value >= 0.7) return 'bg-red-900/60 text-red-200'
  if (value >= 0.4) return 'bg-amber-900/60 text-amber-200'
  if (value >= 0.2) return 'bg-yellow-900/60 text-yellow-200'
  return 'bg-green-900/60 text-green-200'
}

const getRiskLabel = (value: number) => {
  if (value >= 0.7) return 'HIGH'
  if (value >= 0.4) return 'MODERATE'
  if (value >= 0.2) return 'LOW'
  return 'NONE'
}

export function ConflictHeatmap({ data, onCellClick }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ prA: number; prB: number; value: number } | null>(null)

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="font-mono">Conflict Heatmap</CardTitle>
        <CardDescription className="font-mono">
          PR vs PR conflict probability matrix. Darker cells indicate higher conflict probability.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-24 p-2 text-left font-mono font-medium text-muted-foreground">
                  PR
                </th>
                {data.prs.map((pr) => (
                  <th
                    key={pr.number}
                    className="w-20 p-2 text-center font-mono font-medium text-foreground"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    #{pr.number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.prs.map((prA, i) => (
                <tr key={prA.number}>
                  <th className="w-24 p-2 text-left font-mono font-medium text-foreground sticky left-0 bg-card z-10">
                    #{prA.number}
                  </th>
                  {data.matrix[i].map((value, j) => (
                    <td
                      key={j}
                      className={`w-20 h-20 p-1 border border-border transition-colors ${
                        i === j
                          ? 'bg-muted/50 cursor-default'
                          : 'cursor-pointer hover:bg-muted/50'
                      } ${getColor(value)}`}
                      onClick={() => i !== j && onCellClick?.(data.prs[i].number, data.prs[j].number, data.matrix[i][j])}
                      onMouseEnter={() => i !== j && setHoveredCell({ prA: data.prs[i].number, prB: data.prs[j].number, value })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="font-mono font-bold text-foreground">
                          {value > 0.99 ? '>99%' : value === 0 ? '—' : `${(value * 100).toFixed(0)}%`}
                        </span>
                        {i !== j && (
                          <span className="text-xs font-mono text-muted-foreground/70">
                            {getRiskLabel(value)}
                          </span>
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoveredCell && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-card border border-border rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm text-foreground">
                PR #{hoveredCell.prA} ↔ PR #{hoveredCell.prB}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-xs font-mono rounded ${getColor(hoveredCell.value).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                  {getRiskLabel(hoveredCell.value)}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {(hoveredCell.value * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}