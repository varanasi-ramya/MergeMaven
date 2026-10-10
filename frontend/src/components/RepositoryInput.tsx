// Repository input component for MergeMaven with prominent logo mark and light theme.

import { useState } from 'react'
import { ArrowRight, Shield, Network, GitPullRequest, Sparkles } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RepositoryInputProps {
  onAnalyze: (repoUrl: string) => void
  isLoading?: boolean
}

export function RepositoryInput({ onAnalyze, isLoading = false }: RepositoryInputProps) {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (repoUrl.trim()) {
      onAnalyze(repoUrl.trim())
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <Logo size={64} className="border-2 border-border shadow-lg ring-2 ring-burgundy/20" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-burgundy">
            MergeMaven
          </h1>
          <p className="text-xs sm:text-sm font-mono text-sand max-w-md mx-auto leading-relaxed font-medium">
            Predict branch collisions, structural AST overlaps, and optimize merge queues before merging.
          </p>
        </div>

        {/* Input Card */}
        <Card className="border border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base text-burgundy font-bold">Analyze Repository</CardTitle>
            <CardDescription className="text-xs font-mono text-sand">
              Enter a public or authenticated GitHub repository URL
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-url" className="text-xs font-mono text-sand font-bold">
                  REPOSITORY URL
                </Label>
                <Input
                  id="repo-url"
                  type="url"
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="font-mono text-xs h-10 bg-[#FAF3EC] text-foreground border-border"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full font-sans font-semibold text-sm h-10 shadow-md"
                disabled={!repoUrl.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Analyzing PR Conflict Graphs...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Analyze Repository</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Feature Highlights */}
            <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 gap-3 text-xs font-mono text-sand">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="w-4 h-4 text-burgundy shrink-0" />
                <span>Pairwise Conflict Scoring</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Network className="w-4 h-4 text-burgundy shrink-0" />
                <span>Interactive Conflict Graph</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <GitPullRequest className="w-4 h-4 text-burgundy shrink-0" />
                <span>Merge Order Optimization</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-burgundy shrink-0" />
                <span>AST What-If Simulator</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}