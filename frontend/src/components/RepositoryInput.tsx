// Repository input component for MergeMaven frontend.

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RepositoryInputProps {
  onAnalyze: (repoUrl: string) => void
  isLoading?: boolean
}

export function RepositoryInput({ onAnalyze, isLoading = false }: RepositoryInputProps) {
  const [repoUrl, setRepoUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (repoUrl.trim()) {
      onAnalyze(repoUrl.trim())
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mono font-bold text-foreground mb-2">
            MergeMaven
          </h1>
          <p className="text-muted-foreground font-mono">
            Predict pull request conflicts before they happen.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-foreground">Analyze Repository</CardTitle>
            <CardDescription className="font-mono text-muted-foreground">
              Enter a GitHub repository URL to analyze PR conflicts and get merge recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-url" className="font-mono text-foreground">
                  GitHub Repository URL
                </Label>
                <Input
                  id="repo-url"
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="font-mono"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full font-mono"
                disabled={!repoUrl.trim() || isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Analyze Repository'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-mono font-semibold text-foreground mb-2">
                What you'll get:
              </h3>
              <ul className="text-sm font-mono text-muted-foreground space-y-1">
                <li>• Conflict prediction for all PR pairs</li>
                <li>• Risk assessment (Low/Moderate/High)</li>
                <li>• Recommended merge order</li>
                <li>• Interactive conflict graph</li>
                <li>• File-level analysis</li>
                <li>• What-if merge simulator</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}