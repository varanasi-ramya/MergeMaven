// File Drill-Down component for detailed file-level conflict analysis on light background.

import { useState } from 'react'
import { X, FileText, ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

interface FileConflict {
  path: string
  overlap: number
  prAChanges?: {
    lines: { start: number; end: number; content: string }[]
    added: number
    deleted: number
  }
  prBChanges?: {
    lines: { start: number; end: number; content: string }[]
    added: number
    deleted: number
  }
  conflictProbability?: number
}

interface FileDrillDownProps {
  file: FileConflict
  prA?: { number: number; title: string; author: string }
  prB?: { number: number; title: string; author: string }
  onClose: () => void
}

export function FileDrillDown({
  file,
  prA = { number: 142, title: 'Add payment validation', author: 'alice' },
  prB = { number: 147, title: 'Update transaction model', author: 'bob' },
  onClose,
}: FileDrillDownProps) {
  const [activeTab, setActiveTab] = useState<'diff' | 'details' | 'conflicts'>('diff')

  const overlapPct = Math.round(file.overlap * (file.overlap > 1 ? 1 : 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-card border border-border text-burgundy shadow-sm">
              <FileText className="w-5 h-5 text-burgundy" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-burgundy">
                {file.path}
              </div>
              <div className="text-xs font-mono text-sand font-medium mt-0.5">
                PR #{prA.number} ↔ PR #{prB.number} • {overlapPct}% overlap density
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={overlapPct > 70 ? 'high' : 'moderate'} className="text-[11px]">
              {overlapPct}% OVERLAP
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-sand hover:text-burgundy hover:bg-card rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-card">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="diff" className="font-mono text-xs">
                Side-by-Side Diff
              </TabsTrigger>
              <TabsTrigger value="conflicts" className="font-mono text-xs">
                Conflict Regions
              </TabsTrigger>
              <TabsTrigger value="details" className="font-mono text-xs">
                File Details
              </TabsTrigger>
            </TabsList>

            {/* Side by Side Diff */}
            <TabsContent value="diff" className="flex-1 overflow-auto mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* PR A Pane */}
                <div className="rounded-xl bg-[#FAF3EC] border border-border p-4 font-mono text-xs overflow-auto shadow-inner">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border text-burgundy font-bold">
                    <span>PR #{prA.number} (Alice)</span>
                    <span className="text-xs text-sand font-semibold">+24 lines</span>
                  </div>
                  <div className="space-y-1 text-foreground">
                    <div className="text-sand select-none font-semibold">// Line 82</div>
                    <div className="bg-[#561C24]/15 text-burgundy font-semibold p-1.5 rounded border-l-4 border-burgundy">
                      + export async function validatePayment(token: string) &#123;
                    </div>
                    <div className="bg-[#561C24]/15 text-burgundy font-semibold p-1.5 rounded border-l-4 border-burgundy">
                      +   if (!token.startsWith('tok_')) throw new Error('Invalid token');
                    </div>
                    <div className="text-sand px-1">    return await processAuth(token);</div>
                    <div className="text-sand px-1">&#125;</div>
                  </div>
                </div>

                {/* PR B Pane */}
                <div className="rounded-xl bg-[#FAF3EC] border border-border p-4 font-mono text-xs overflow-auto shadow-inner">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border text-brown-deep font-bold">
                    <span>PR #{prB.number} (Bob)</span>
                    <span className="text-xs text-sand font-semibold">+18 lines</span>
                  </div>
                  <div className="space-y-1 text-foreground">
                    <div className="text-sand select-none font-semibold">// Line 82</div>
                    <div className="bg-[#7D4F42]/15 text-brown-deep font-semibold p-1.5 rounded border-l-4 border-brown-accent">
                      + export async function validatePayment(payload: TxnPayload) &#123;
                    </div>
                    <div className="bg-[#7D4F42]/15 text-brown-deep font-semibold p-1.5 rounded border-l-4 border-brown-accent">
                      +   const isValid = await schemaValidator.verify(payload);
                    </div>
                    <div className="text-sand px-1">    return isValid;</div>
                    <div className="text-sand px-1">&#125;</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Conflict Regions */}
            <TabsContent value="conflicts" className="flex-1 overflow-auto mt-0 space-y-3">
              <div className="p-4 rounded-xl bg-card-elevated border border-border space-y-2 text-xs font-mono shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-burgundy font-bold text-sm">Region 1: Lines 82-96</span>
                  <Badge variant="high">Direct Collision</Badge>
                </div>
                <p className="text-foreground text-[11px] font-medium leading-relaxed">
                  Method signature mismatch on <code className="text-burgundy bg-card px-1.5 py-0.5 rounded border border-border font-bold">validatePayment()</code> between token-string vs payload-object signatures.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card-elevated border border-border space-y-2 text-xs font-mono shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-brown-deep font-bold text-sm">Region 2: Lines 140-155</span>
                  <Badge variant="moderate">Semantic Collision</Badge>
                </div>
                <p className="text-foreground text-[11px] font-medium leading-relaxed">
                  Error handling callback modifications affect the returned HTTP response status.
                </p>
              </div>
            </TabsContent>

            {/* File Details */}
            <TabsContent value="details" className="flex-1 overflow-auto mt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-card-elevated border border-border shadow-sm">
                  <span className="text-sand text-[10px] uppercase font-bold">File Size</span>
                  <div className="text-xl font-bold text-burgundy mt-1">320 lines</div>
                </div>
                <div className="p-4 rounded-xl bg-card-elevated border border-border shadow-sm">
                  <span className="text-sand text-[10px] uppercase font-bold">Overlapping Span</span>
                  <div className="text-xl font-bold text-burgundy mt-1">64 lines (85%)</div>
                </div>
                <div className="p-4 rounded-xl bg-card-elevated border border-border shadow-sm">
                  <span className="text-sand text-[10px] uppercase font-bold">AST Nodes</span>
                  <div className="text-xl font-bold text-brown-deep mt-1">12 intersecting</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}