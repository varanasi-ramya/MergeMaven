"""File Drill-Down component for detailed file-level conflict analysis."""

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FileConflict {
  path: string
  overlap: number
  prAChanges: {
    lines: { start: number; end: number; content: string }[]
    added: number
    deleted: number
  }
  prBChanges: {
    lines: { start: number; end: number; content: string }[]
    added: number
    deleted: number
  }
  conflictProbability: number
}

interface FileDrillDownProps {
  file: FileConflict
  prA: { number: number; title: string; author: string }
  prB: { number: number; title: string; author: string }
  onClose: () => void
}

export function FileDrillDown({ file, prA, prB, onClose }: FileDrillDownProps) {
  const [activeTab, setActiveTab] = useState<'diff' | 'details' | 'conflicts'>('diff')

  const getRiskColor = (prob: number) => {
    if (prob >= 0.7) return 'bg-red-900/50 text-red-300 border-red-700'
    if (prob >= 0.4) return 'bg-amber-900/50 text-amber-300 border-amber-700'
    return 'bg-green-900/50 text-green-300 border-green-700'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-card border border-border rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
            <div>
              <div className="font-mono font-semibold text-foreground">
                {file.path}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                Overlap: {(file.overlap * 100).toFixed(0)}% • Conflict: {(file.conflictProbability * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <Badge className={`font-mono ${['HIGH', 'MODERATE', 'LOW'].includes(
            file.overlap >= 0.7 ? 'HIGH' : file.overlap >= 0.4 ? 'MODERATE' : 'LOW'
          ) ? '' : ''}`}>
            {(file.overlap * 100).toFixed(0)}% Overlap
          </Badge>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="border-b border-border">
              <TabsTrigger value="diff" className="font-mono text-sm">
                Side-by-Side Diff
              </TabsTrigger>
              <TabsTrigger value="details" className="font-mono text-sm">
                File Details
              </TabsTrigger>
              <TabsTrigger value="conflicts" className="font-mono text-sm">
                Conflict Regions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diff" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* PR A */}
                <div className="bg-red-900/10 border border-red-900/30 rounded-lg flex flex-col">
                  <div className="p-3 border-b border-red-900/30">
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-semibold text-red-400">
                        PR #{prA.number} ({prA.author})
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        +{file.prAChanges.added} -{file.prAChanges.deleted}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                    <pre className="font-mono text-xs leading-relaxed">
{file.prAChanges.lines.map((line, i) => (
  <div key={i} className={`leading-relaxed ${line.content.startsWith('+') ? 'text-green-400' : line.content.startsWith('-') ? 'text-red-400' : 'text-muted-foreground'}`}>
    {String(line.start).padStart(4, ' ')} | {line.content}
  </div>
))}
                    </pre>
                  </div>
                </div>

                {/* PR B */}
                <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg flex flex-col">
                  <div className="p-3 border-b border-amber-900/30">
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-semibold text-amber-400">
                        PR #{prB.number} ({prB.author})
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        +{file.prBChanges.added} -{file.prBChanges.deleted}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                    <pre className="font-mono text-xs leading-relaxed">
{file.prBChanges.lines.map((line, i) => (
  <div key={i} className={`leading-relaxed ${line.content.startsWith('+') ? 'text-green-400' : line.content.startsWith('-') ? 'text-red-400' : 'text-muted-foreground'}`}>
    {String(line.start).padStart(4, ' ')} | {line.content}
  </div>
))}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="flex-1 overflow-auto p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-mono font-semibold text-foreground mb-4">File Metadata</h3>
                  <dl className="space-y-3 text-sm font-mono">
                    <div className="grid grid-cols-2 gap-2">
                      <dt className="text-muted-foreground">Path</dt>
                      <dd className="font-mono text-foreground">{file.path}</dd>
                      <dt className="text-muted-foreground">Overlap</dt>
                      <dd className="font-bold text-foreground">{(file.overlap * 100).toFixed(0)}%</dd>
                      <dt className="text-muted-foreground">Conflict Probability</dt>
                      <dd className="font-bold text-foreground">{(file.conflictProbability * 100).toFixed(0)}%</dd>
                      <dt className="text-muted-foreground">Risk Level</dt>
                      <dd>
                        <Badge className="font-mono">
                          {file.overlap >= 0.7 ? 'HIGH' : file.overlap >= 0.4 ? 'MODERATE' : 'LOW'}
                        </Badge>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div>
                  <h3 className="font-mono font-semibold text-foreground mb-4">PR Changes Summary</h3>
                  <div className="space-y-3 text-sm font-mono">
                    <div className="grid grid-cols-3 gap-2 p-3 bg-red-900/10 border border-red-900/30 rounded">
                      <span className="font-semibold text-red-400">PR #{prA.number}</span>
                      <span className="text-green-400">+{file.prAChanges.added}</span>
                      <span className="text-red-400">-{file.prAChanges.deleted}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3 bg-amber-900/10 border border-amber-900/30 rounded">
                      <span className="font-semibold text-amber-400">PR #{prB.number}</span>
                      <span className="text-green-400">+{file.prBChanges.added}</span>
                      <span className="text-red-400">-{file.prBChanges.deleted}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 border border-border rounded">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-green-400">+{file.prAChanges.added + file.prBChanges.added}</span>
                      <span className="text-red-400">-{file.prAChanges.deleted + file.prBChanges.deleted}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conflicts" className="flex-1 overflow-auto p-4 space-y-4">
              <div className="space-y-3">
                <h3 className="font-mono font-semibold text-foreground">
                  Overlapping Line Regions
                </h3>
                <div className="space-y-2">
                  <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold text-red-400">
                        Lines 45-67
                      </span>
                      <Badge className="font-mono bg-red-900/50 text-red-300">
                        CONFLICT
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground font-mono leading-relaxed">
PR A: + validatePayment();\nPR B: + processRefund();\nBoth modify checkout flow
                    </div>
                  </div>
                  <div className="p-3 bg-amber-900/20 border border-amber-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold text-amber-400">
                        Lines 89-102
                      </span>
                      <Badge className="font-mono bg-amber-900/50 text-amber-300">
                        CONFLICT
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground font-mono leading-relaxed">
PR A: + validateCoupon();\nPR B: + applyDiscount();\nBoth modify payment validation
                    </div>
                  </div>
                  <div className="p-3 bg-green-900/20 border border-green-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold text-green-400">
                        Lines 120-135
                      </span>
                      <Badge className="font-mono bg-green-900/50 text-green-300">
                        SAFE
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground font-mono leading-relaxed">
PR A: formatting only\nPR B: comment updates\nNo semantic conflict
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}