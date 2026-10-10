// Verification component showing git merge-tree simulation results on light background.

import { useState } from 'react'
import { X, GitMerge, ShieldAlert, Terminal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VerificationResult {
  prA: number
  prB: number
  baseCommit: string
  headA: string
  headB: string
  didConflict: boolean
  conflictingFiles: string[]
  prediction: {
    probability: number
    riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
  }
  simulationOutput: string
}

interface VerificationProps {
  result?: VerificationResult
  onClose: () => void
}

const defaultResult: VerificationResult = {
  prA: 142,
  prB: 147,
  baseCommit: 'a1b2c3d',
  headA: 'e4f5g6h',
  headB: 'i7j8k9l',
  didConflict: true,
  conflictingFiles: ['src/payments/checkout.ts', 'src/payments/processor.ts'],
  prediction: {
    probability: 0.87,
    riskLevel: 'HIGH',
  },
  simulationOutput: `Auto-merging src/payments/checkout.ts
CONFLICT (content): Merge conflict in src/payments/checkout.ts
Auto-merging src/payments/processor.ts
CONFLICT (content): Merge conflict in src/payments/processor.ts
Automatic merge failed; fix conflicts and then commit the result.`,
}

export function Verification({ result = defaultResult, onClose }: VerificationProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'simulation' | 'prediction'>('summary')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-card border border-border shadow-sm">
              <GitMerge className="w-5 h-5 text-burgundy" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-burgundy">
                Git Merge-Tree Verification
              </h2>
              <p className="text-xs font-mono text-sand font-medium mt-0.5">
                Dry-run 3-way merge simulation for PR #{result.prA} ↔ PR #{result.prB}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-sand hover:text-burgundy hover:bg-card rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-card">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="summary" className="font-mono text-xs">
                Summary
              </TabsTrigger>
              <TabsTrigger value="simulation" className="font-mono text-xs">
                Terminal Output
              </TabsTrigger>
              <TabsTrigger value="prediction" className="font-mono text-xs">
                Model Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto mt-0 space-y-4">
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-card-elevated border border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-burgundy flex items-center justify-center text-white shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-burgundy">
                      {result.didConflict ? 'Dry-Run Conflict Confirmed' : 'Clean Merge Verified'}
                    </span>
                    <p className="text-[11px] font-mono text-sand font-medium">
                      {result.conflictingFiles.length} files failed auto-merge resolution
                    </p>
                  </div>
                </div>
                <Badge variant={result.didConflict ? 'high' : 'low'} className="text-xs">
                  {result.didConflict ? 'CONFLICT OCCURRED' : 'NO CONFLICT'}
                </Badge>
              </div>

              {/* Conflicting Files */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-bold">
                  Conflicting Files ({result.conflictingFiles.length})
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {result.conflictingFiles.map((file, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#FAF3EC] border border-border text-foreground font-semibold shadow-inner">
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="simulation" className="flex-1 overflow-auto mt-0">
              <div className="rounded-xl bg-[#221210] border border-border p-4 font-mono text-xs text-[#F5EBE0] overflow-auto shadow-inner">
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/30 text-sand/70 text-[10px]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>git merge-tree {result.baseCommit} {result.headA} {result.headB}</span>
                </div>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap">{result.simulationOutput}</pre>
              </div>
            </TabsContent>

            <TabsContent value="prediction" className="flex-1 overflow-auto mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-card-elevated border border-border shadow-sm">
                  <span className="text-[10px] text-sand uppercase font-bold">Predicted Probability</span>
                  <div className="text-2xl font-bold text-burgundy mt-1">
                    {Math.round(result.prediction.probability * 100)}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-card-elevated border border-border shadow-sm">
                  <span className="text-[10px] text-sand uppercase font-bold">Actual Simulation Match</span>
                  <div className="text-2xl font-bold text-brown-deep mt-1">
                    Confirmed
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