// Analysis Configuration component for repository settings on light background.

import { useState } from 'react'
import { X, Sliders, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface AnalysisConfigProps {
  repoUrl?: string
  onSave?: (config: any) => void
  onCancel: () => void
}

export function AnalysisConfig({
  repoUrl = 'https://github.com/varanasi-ramya/MergeMaven',
  onSave,
  onCancel,
}: AnalysisConfigProps) {
  const [baseBranch, setBaseBranch] = useState('main')
  const [includeHistorical, setIncludeHistorical] = useState(true)
  const [historicalDays, setHistoricalDays] = useState(90)
  const [minConfidence, setMinConfidence] = useState(0.5)
  const [highRiskThreshold, setHighRiskThreshold] = useState(0.7)

  const handleSave = () => {
    onSave?.({
      repoUrl,
      baseBranch,
      includeHistorical,
      historicalDays,
      minConfidence,
      riskThresholds: { high: highRiskThreshold, moderate: 0.4 },
    })
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-card border border-border shadow-sm">
              <Sliders className="w-5 h-5 text-burgundy" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-burgundy">
                Analysis Engine Configuration
              </h2>
              <p className="text-xs font-mono text-sand font-medium mt-0.5">
                Configure conflict detection heuristics and Bayesian network thresholds
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 text-sand hover:text-burgundy hover:bg-card rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono bg-card">
          {/* Base Branch */}
          <div className="space-y-2">
            <Label className="text-sand font-bold text-[11px] uppercase">Base Target Branch</Label>
            <Input
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              className="h-9 bg-[#FAF3EC] text-foreground border-border"
            />
          </div>

          {/* Thresholds Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sand font-bold text-[11px] uppercase">
                High-Risk Threshold ({Math.round(highRiskThreshold * 100)}%)
              </Label>
              <Input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(parseFloat(e.target.value) || 0.7)}
                className="h-9 bg-[#FAF3EC] text-foreground border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sand font-bold text-[11px] uppercase">
                Min Confidence Filter ({Math.round(minConfidence * 100)}%)
              </Label>
              <Input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value) || 0.5)}
                className="h-9 bg-[#FAF3EC] text-foreground border-border"
              />
            </div>
          </div>

          {/* Historical Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card-elevated border border-border shadow-sm">
            <div>
              <span className="text-burgundy font-bold">Historical Conflict Dataset</span>
              <p className="text-[11px] text-sand font-medium mt-0.5">
                Incorporate past resolved merge conflicts into Bayesian prior calculation
              </p>
            </div>
            <Switch checked={includeHistorical} onCheckedChange={setIncludeHistorical} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={onCancel} className="text-foreground hover:text-burgundy border-border">
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} className="shadow-md">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}