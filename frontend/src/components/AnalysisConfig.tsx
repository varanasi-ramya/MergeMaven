"""Analysis Configuration component for repository settings."""

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface AnalysisConfigProps {
  repoUrl: string
  onSave: (config: AnalysisConfig) => void
  onCancel: () => void
}

interface AnalysisConfig {
  repoUrl: string
  baseBranch: string
  includeHistorical: boolean
  historicalDays: number
  minConfidence: number
  riskThresholds: {
    high: number
    moderate: number
  }
  excludedPaths: string[]
  webhookUrl: string
}

const defaultConfig: AnalysisConfig = {
  repoUrl: '',
  baseBranch: 'main',
  includeHistorical: true,
  historicalDays: 90,
  minConfidence: 0.5,
  riskThresholds: {
    high: 0.7,
    moderate: 0.3,
  },
  excludedPaths: [
    '*.md',
    '*.txt',
    '*.json',
    'package-lock.json',
    'yarn.lock',
  ],
  webhookUrl: '',
}

export function AnalysisConfig({ repoUrl, onSave, onCancel }: AnalysisConfigProps) {
  const [config, setConfig] = useState<AnalysisConfig>({ ...defaultConfig, repoUrl })
  const [excludedPathsInput, setExcludedPathsInput] = useState(config.excludedPaths.join('\n'))

  const handleSave = () => {
    onSave({ ...config, excludedPaths: excludedPathsInput.split('\n').filter(Boolean) })
  }

  const handleExcludedPathsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExcludedPathsInput(e.target.value)
    setConfig({ ...config, excludedPaths: e.target.value.split('\n').filter(Boolean) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-mono font-semibold text-foreground">
            Analysis Configuration
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Repository Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Repository</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-url" className="font-mono text-sm text-foreground">
                  Repository URL
                </Label>
                <Input
                  id="repo-url"
                  type="url"
                  value={config.repoUrl}
                  onChange={(e) => setConfig({ ...config, repoUrl: e.target.value })}
                  className="font-mono"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-branch" className="font-mono text-sm text-foreground">
                  Base Branch
                </Label>
                <Select value={config.baseBranch} onValueChange={(v) => setConfig({ ...config, baseBranch: v })}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select base branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">main</SelectItem>
                    <SelectItem value="master">master</SelectItem>
                    <SelectItem value="develop">develop</SelectItem>
                    <SelectItem value="staging">staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-mono">Include Historical Data</Label>
                  <p className="text-xs text-muted-foreground font-mono">
                    Use historical merge data to improve predictions
                  </p>
                </div>
                <Switch
                  checked={config.includeHistorical}
                  onCheckedChange={(checked) => setConfig({ ...config, includeHistorical: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historical-days" className="font-mono text-sm">
                  Historical Data Window (days)
                </Label>
                <Input
                  id="historical-days"
                  type="number"
                  min="1"
                  max="365"
                  value={config.historicalDays}
                  onChange={(e) => setConfig({ ...config, historicalDays: parseInt(e.target.value) || 0 })}
                  className="font-mono w-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-confidence" className="font-mono text-sm">
                  Minimum Confidence Threshold
                </Label>
                <Input
                  id="min-confidence"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.minConfidence}
                  onChange={(e) => setConfig({ ...config, minConfidence: parseFloat(e.target.value) || 0 })}
                  className="font-mono w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk Thresholds */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Risk Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="high-threshold" className="font-mono text-sm">
                  High Risk Threshold
                </Label>
                <Input
                  id="high-threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.riskThresholds.high}
                  onChange={(e) => setConfig({ ...config, riskThresholds: { ...config.riskThresholds, high: parseFloat(e.target.value) || 0 } })}
                  className="font-mono w-32"
                />
                <p className="text-xs text-muted-foreground font-mono">Above this probability = HIGH risk</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moderate-threshold" className="font-mono text-sm">
                  Moderate Risk Threshold
                </Label>
                <Input
                  id="moderate-threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.riskThresholds.moderate}
                  onChange={(e) => setConfig({ ...config, riskThresholds: { ...config.riskThresholds, moderate: parseFloat(e.target.value) || 0 } })}
                  className="font-mono w-32"
                />
                <p className="text-xs text-muted-foreground font-mono">Above this = MODERATE, below = LOW</p>
              </div>
            </CardContent>
          </Card>

          {/* Excluded Paths */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Excluded Paths</CardTitle>
              <CardDescription className="font-mono">
                Paths to exclude from analysis (one per line, glob patterns supported)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={excludedPathsInput}
                onChange={handleExcludedPathsChange}
                className="w-full h-32 font-mono text-sm p-3 bg-muted border border-border rounded-lg resize-none"
                placeholder="*.md&#10;*.txt&#10;*.json&#10;package-lock.json&#10;yarn.lock"
              />
            </CardContent>
          </Card>

          {/* Webhook */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-mono">Webhook Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="font-mono text-sm">
                  Webhook URL
                </Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-webhook-url.com/merge-maven"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Receive notifications when analysis completes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={onCancel} className="font-mono">
              Cancel
            </Button>
            <Button onClick={handleSave} className="font-mono">
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}