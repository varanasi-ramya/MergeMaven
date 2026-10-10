/**
 * MergeMaven API client — all fetch calls to the Flask backend live here.
 * Base URL auto-detects: same origin in production, localhost:5001 in dev.
 */

/// <reference types="vite/client" />

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:5001' : '')

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error || `API error ${res.status}`)
  }
  return json as T
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PRInfo {
  number: number
  title: string
  author: string
  filesChanged: number
  branch?: string
}

export interface ConflictPrediction {
  id: string
  prA: PRInfo
  prB: PRInfo
  conflictProbability: number
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
  sharedFiles: number
  sharedFilesList?: string[]
  sharedLines: number
  confidence: number
}

export interface MergeOrderEntry {
  prNumber: number
  title: string
  conflictScore: number
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
}

export interface AnalyzeResult {
  repo_url: string
  pr_count: number
  conflict_count: number
  conflicts: ConflictPrediction[]
  prs: Array<{
    number: number
    title: string
    author: string
    filesChanged: number
    linesAdded: number
    linesDeleted: number
  }>
  merge_order: MergeOrderEntry[]
  message?: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Trigger the full fetch → feature extract → predict pipeline for a repo. */
export async function analyzeRepo(repoUrl: string, token?: string): Promise<AnalyzeResult> {
  return apiFetch<AnalyzeResult>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl, token }),
  })
}

/** Fetch cached conflicts without re-running the pipeline. */
export async function getConflicts(repoUrl: string): Promise<{ conflicts: ConflictPrediction[] }> {
  return apiFetch(`/api/conflicts?repo_url=${encodeURIComponent(repoUrl)}`)
}

/** Get stored PR list for a repo. */
export async function getPRs(repoUrl: string) {
  return apiFetch(`/api/prs?repo_url=${encodeURIComponent(repoUrl)}`)
}

/** Get the recommended merge order for a repo. */
export async function getMergeOrder(repoUrl: string): Promise<{ merge_order: MergeOrderEntry[] }> {
  return apiFetch(`/api/merge-order?repo_url=${encodeURIComponent(repoUrl)}`)
}
