// Main application component for MergeMaven - Phase 2

import { useState } from 'react'

import { ConflictDetail } from './components/ConflictDetail'
import { ConflictList } from './components/ConflictList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

// Mock data for Phase 2 demonstration
const mockConflicts = [
  {
    id: 'conflict-1',
    prA: { number: 142, title: 'Add payment validation', author: 'alice', filesChanged: 8 },
    prB: { number: 147, title: 'Update transaction model', author: 'bob', filesChanged: 6 },
    conflictProbability: 0.87,
    riskLevel: 'HIGH' as const,
    sharedFiles: 4,
    sharedLines: 124,
    confidence: 0.91,
  },
  {
    id: 'conflict-2',
    prA: { number: 145, title: 'Refactor checkout flow', author: 'charlie', filesChanged: 5 },
    prB: { number: 148, title: 'Add Stripe integration', author: 'david', filesChanged: 4 },
    conflictProbability: 0.64,
    riskLevel: 'MODERATE' as const,
    sharedFiles: 2,
    sharedLines: 89,
    confidence: 0.83,
  },
  {
    id: 'conflict-3',
    prA: { number: 139, title: 'Update API endpoints', author: 'eve', filesChanged: 3 },
    prB: { number: 144, title: 'Fix database queries', author: 'frank', filesChanged: 2 },
    conflictProbability: 0.18,
    riskLevel: 'LOW' as const,
    sharedFiles: 1,
    sharedLines: 23,
    confidence: 0.76,
  },
]

export default function App() {
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  const [repoUrl, setRepoUrl] = useState('https://github.com/example/repo')

  const selectedConflict = mockConflicts.find(c => c.id === selectedConflictId)

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                MergeMaven
              </h1>
              <p className="text-sm text-muted-foreground">
                Analyzing: {repoUrl}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {mockConflicts.length} conflicts • 3 repositories analyzed
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!selectedConflictId ? (
          // Phase 2: Conflict List View
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-mono">High-Risk Conflicts</CardTitle>
                <CardDescription className="font-mono">
                  PR pairs with elevated conflict probability ({mockConflicts.filter(c => c.riskLevel === 'HIGH').length} high-risk conflicts)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConflictList
                  conflicts={mockConflicts.filter(c => c.riskLevel === 'HIGH')}
                  onSelectConflict={(c) => setSelectedConflictId(c.id)}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-sm font-mono text-muted-foreground mb-1">TOTAL OPEN PRs</div>
                  <div className="text-2xl font-bold text-foreground">18</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-sm font-mono text-muted-foreground mb-1">PREDICTED CONFLICTS</div>
                  <div className="text-2xl font-bold text-red-400">6</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-sm font-mono text-muted-foreground mb-1">HIGH RISK</div>
                  <div className="text-2xl font-bold text-red-400">2</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-sm font-mono text-muted-foreground mb-1">CONFIDENCE</div>
                  <div className="text-2xl font-bold text-green-400">87%</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-sm font-mono text-muted-foreground mb-1">AVERAGE RISK</div>
                  <div className="text-2xl font-bold text-amber-400">MODERATE</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-sm font-mono text-muted-foreground mb-1">ANALYSIS TIME</div>
                  <div className="text-2xl font-bold text-foreground">2.3m</div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Phase 2: Conflict Detail View
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setSelectedConflictId(null)}
                className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mr-4"
              >
                ← Back to Conflicts List
              </button>
              <div>
                <h2 className="text-xl font-mono font-semibold text-foreground">
                  Conflict Analysis
                </h2>
                <p className="text-sm font-mono text-muted-foreground">
                  PR #{selectedConflict?.prA.number} ↔ PR #{selectedConflict?.prB.number}
                </p>
              </div>
            </div>

            <ConflictDetail conflict={selectedConflict!} />
          </div>
        )}
      </div>
    </div>
  )
}