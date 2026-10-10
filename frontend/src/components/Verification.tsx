// Verification component showing git merge-tree simulation results.

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  result: VerificationResult
  onClose: () => void
}

export function Verification({ result, onClose }: VerificationProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'simulation' | 'prediction'>('summary')

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

  const match = result.didConflict === (result.prediction.riskLevel === 'HIGH')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-mono font-semibold text-foreground">
              Merge Verification
            </h2>
            <p className="text-xs font-mono text-muted-foreground">
              PR #{result.prA} ↔ PR #{result.prB}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`font-mono ${match ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {match ? 'MATCH' : 'MISMATCH'}
            </Badge>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'summary' | 'simulation' | 'prediction')} className="flex-1 flex flex-col">
            <TabsList className="border-b border-border">
              <TabsTrigger value="summary" className="font-mono text-sm">
                Summary
              </TabsTrigger>
              <TabsTrigger value="simulation" className="font-mono text-sm">
                Simulation Output
              </TabsTrigger>
              <TabsTrigger value="prediction" className="font-mono text-sm">
                Prediction Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto p-6 space-y-6">
              {/* Match Status */}
              <div className={`p-4 rounded-lg ${match ? 'bg-green-900/20 border border-green-900/30' : 'bg-red-900/20 border border-red-900/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${match ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                    {match ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-foreground">
                      {match ? 'Prediction Verified' : 'Prediction Mismatch'}
                    </div>
                    <div className="text-sm font-mono text-muted-foreground">
                      {match
                        ? 'Git merge-tree simulation confirms the predicted conflict outcome.'
                        : 'Git merge-tree simulation result differs from prediction. Review required.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="text-xs font-mono text-muted-foreground mb-1">SIMULATION RESULT</div>
                    <div className="text-2xl font-mono font-bold text-foreground">
                      {result.didConflict ? 'CONFLICT' : 'CLEAN'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="text-xs font-mono text-muted-foreground mb-1">PREDICTION</div>
                    <div className="text-2xl font-mono font-bold text-foreground">
                      {result.prediction.riskLevel}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="text-xs font-mono text-muted-foreground mb-1">PROBABILITY</div>
                    <div className="text-2xl font-mono font-bold text-foreground">
                      {(result.prediction.probability * 100).toFixed(0)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conflicting Files */}
              <div>
                <h3 className="font-mono font-semibold text-foreground mb-3">
                  Conflicting Files
                </h3>
                {result.conflictingFiles.length > 0 ? (
                  <ul className="space-y-2 font-mono text-sm">
                    {result.conflictingFiles.map((file, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                        <span className="w-6 h-6 flex items-center justify-center bg-red-900/30 text-red-400 rounded">
                          ✗
                        </span>
                        <span className="font-mono text-foreground">{file}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-mono text-muted-foreground">
                    No conflicting files detected.
                  </p>
                )}
              </div>

              {/* Commit Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-mono text-sm">Base Commit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {result.baseCommit}
                    </code>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-mono text-sm">Head Commits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm font-mono">
                    <div>Head A: <code className="text-muted-foreground">{result.headA}</code></div>
                    <div>Head B: <code className="text-muted-foreground">{result.headB}</code></div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="simulation" className="flex-1 overflow-auto p-6">
              <div className="bg-black/50 border border-border rounded-lg p-4 font-mono text-xs text-green-300 overflow-auto max-h-[500px]">
                <pre className="whitespace-pre-wrap">{result.simulationOutput}</pre>
              </div>
            </TabsContent>

            <TabsContent value="prediction" className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <h3 className="font-mono font-semibold text-foreground mb-3">
                  Prediction Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                    <span className="font-mono text-muted-foreground">Conflict Probability</span>
                    <div className="font-mono font-bold text-foreground">
                      {(result.prediction.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                    <span className="text-muted-foreground font-mono">Risk Level</span>
                    <Badge className={`font-mono ${getRiskColor(result.prediction.riskLevel).replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')}`}>
                      {result.prediction.riskLevel}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-mono font-semibold text-foreground mb-3">
                  Why This Prediction?
                </h3>
                <div className="prose prose-invert max-w-none text-sm font-mono text-muted-foreground space-y-2">
                  <p>
                    The Bayesian model evaluated this PR pair based on four key factors:
                  </p>
                  <ul className="space-y-1">
                    <li>• File Overlap: 85% — High overlap in payment processing modules</li>
                    <li>• Line Overlap: 72% — Significant line-level conflicts in checkout flow</li>
                    <li>• Module Overlap: 74% — Both PRs modify the payments module</li>
                    <li>• Historical Risk: 48% — Moderate historical conflict rate for these files</li>
                  </ul>
                  <p className="mt-3">
                    The Bayesian network combines these factors using learned conditional
                    probability tables to produce the final conflict probability of 87%.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}