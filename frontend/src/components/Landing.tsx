// Landing / onboarding screen — shown before the dashboard loads.
// User enters a GitHub repo URL here; on submit the dashboard appears.

import { useState } from 'react'
import { ArrowRight, GitBranch } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface LandingProps {
  onAnalyze: (repoUrl: string) => void
  isLoading?: boolean
  error?: string | null
}

export function Landing({ onAnalyze, isLoading = false, error }: LandingProps) {
  const [repoUrl, setRepoUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = repoUrl.trim()
    if (url) onAnalyze(url)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Card container */}
      <div className="w-full max-w-md">

        {/* ── Brand ── */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <Logo size={80} className="shadow-xl" />
          <h1 className="text-3xl font-bold tracking-tight text-burgundy font-sans">
            MergeMaven
          </h1>
        </div>

        {/* ── Input card ── */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <p className="text-sm font-mono text-foreground font-semibold mb-1">
            GitHub Repository URL
          </p>
          <p className="text-xs font-mono text-sand mb-5">
            Public or private repository (paste the full URL)
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand pointer-events-none" />
              <input
                id="repo-url-input"
                type="url"
                autoFocus
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
                className={`
                  w-full pl-9 pr-4 py-2.5 rounded-xl
                  border border-border bg-background
                  font-mono text-sm text-foreground placeholder:text-sand/60
                  focus:outline-none focus:ring-2 focus:ring-burgundy/40 focus:border-burgundy
                  transition-all duration-150
                  disabled:opacity-50
                `}
              />
            </div>

            <button
              id="analyze-repo-btn"
              type="submit"
              disabled={!repoUrl.trim() || isLoading}
              className={`
                w-full flex items-center justify-center gap-2
                py-2.5 rounded-xl font-sans font-semibold text-sm
                bg-burgundy text-cream shadow-md
                hover:bg-[#6D2932] active:scale-[0.98]
                transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
              `}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-cream/30 border-t-cream animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <span>Analyze Repository</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Error banner */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <p className="text-xs font-mono leading-relaxed">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* ── Tagline ── */}
        <p className="text-center text-xs font-mono text-sand mt-5 leading-relaxed">
          Predict merge conflicts before they happen — not after.
        </p>
      </div>
    </div>
  )
}
