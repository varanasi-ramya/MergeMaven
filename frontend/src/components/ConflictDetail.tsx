"""Conflict detail component showing comprehensive analysis of a PR conflict."""

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ConflictDetailProps {
  conflict: {
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
}

export function ConflictDetail({ conflict }: ConflictDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'analysis'>('overview')

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-900/50 text-red-300'
      case 'MODERATE':
        return 'bg-amber-900/50 text-amber-300'
      case 'LOW':
        return 'bg-green-900/50 text-green-300'
      default:
        return 'bg-gray-900/50 text-gray-300'
    }
  }

  const mockSharedFiles = [
    { path: 'src/payments/checkout.ts', overlap: 85 },
    { path: 'src/payments/processor.ts', overlap: 72 },
    { path: 'src/payments/validation.ts', overlap: 41 },
    { path: 'src/orders/service.ts', overlap: 23 },
    { path: 'src/users/auth.ts', overlap: 18 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold text-foreground mb-2">
            Conflict Analysis
          </h1>
          <p className="text-muted-foreground font-mono">
            PR #{conflict.prA.number} ↔ PR #{conflict.prB.number}
          </p>
        </div>
        <Badge className={`${getRiskColor(conflict.riskLevel)} font-mono text-lg px-3 py-1`}>
          {conflict.riskLevel}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-mono text-muted-foreground mb-1">CONFLICT PROBABILITY</div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {(conflict.conflictProbability * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-mono text-muted-foreground mb-1">SHARED FILES</div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {conflict.sharedFiles}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-mono text-muted-foreground mb-1">SHARED LINES</div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {conflict.sharedLines}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-mono text-muted-foreground mb-1">CONFIDENCE</div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {(conflict.confidence * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {['overview', 'files', 'analysis'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-1 border-b-2 font-mono text-sm transition-colors ${activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'}
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-mono">PR Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-mono font-semibold text-foreground mb-2">
                      PR #{conflict.prA.number}
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground mb-1">
                      Author: {conflict.prA.author}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      Files changed: {conflict.prA.filesChanged}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-mono font-semibold text-foreground mb-2">
                      PR #{conflict.prB.number}
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground mb-1">
                      Author: {conflict.prB.author}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      Files changed: {conflict.prB.filesChanged}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-mono">Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-muted-foreground">File Overlap</span>
                    <span className="font-mono font-semibold text-foreground">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: '85%' }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-muted-foreground">Line Overlap</span>
                    <span className="font-mono font-semibold text-foreground">72%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: '72%' }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-muted-foreground">Module Overlap</span>
                    <span className="font-mono font-semibold text-foreground">41%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: '41%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'files' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Shared Files Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockSharedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="font-mono font-medium text-foreground">
                        {file.path}
                      </div>
                      <div className="text-sm font-mono text-muted-foreground">
                        {file.overlap}% overlap
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-muted-foreground mb-1">
                        Impact Level
                      </div>
                      <div
                        className={`font-mono font-semibold ${file.overlap > 80 ? 'text-red-400' : file.overlap > 60 ? 'text-amber-400' : 'text-green-400'}
                      >
                        {file.overlap > 80 ? 'HIGH' : file.overlap > 60 ? 'MOD' : 'LOW'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analysis' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Conflict Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <h4 className="font-mono font-semibold text-foreground mb-3">
                  Why These PRs Conflict
                </h4>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-4">
                  These PRs conflict because they both modify the same core payment processing modules.
                  Specifically, they overlap on:
                </p>
                <ul className="text-sm font-mono text-muted-foreground space-y-2">
                  <li>• Checkout workflow modifications in `src/payments/checkout.ts`</li>
                  <li>• Payment processing logic updates in `src/payments/processor.ts`</li>
                  <li>• Validation function changes in `src/payments/validation.ts`</li>
                  <li>• Related user authentication dependencies</li>
                </ul>

                <h4 className="font-mono font-semibold text-foreground mb-3 mt-6">
                  Risk Factors
                </h4>
                <ul className="text-sm font-mono text-muted-foreground space-y-2">
                  <li>• High file overlap (85%) indicates similar scope changes</li>
                  <li>• Recent feature additions may introduce integration points</li>
                  <li>• Historical conflict patterns suggest similar integration issues</li>
                </ul>

                <h4 className="font-mono font-semibold text-foreground mb-3 mt-6">
                  Recommendations
                </h4>
                <ul className="text-sm font-mono text-muted-foreground space-y-2">
                  <li>• Consolidate changes into single PR to avoid merge conflicts</li>
                  <li>• Rebase one PR onto the other's branch before merging</li>
                  <li>• Review and resolve conflicting code sections before merge</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}