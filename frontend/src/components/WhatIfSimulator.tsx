"""What-If Simulator component for MergeMaven merge order experimentation."""

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PR {
  id: string
  number: number
  title: string
  author: string
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
  conflictProbability: number
}

interface SimulatorItemProps {
  item: PR
  index: number
  isDragging: boolean
  isInQueue: boolean
}

function SimulatorItem({ item, index, isDragging, isInQueue }: SimulatorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-3 bg-card border border-border rounded-lg transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
      {...attributes}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold text-foreground">
            {index + 1}.
          </span>
          <div>
            <div className="font-mono font-semibold text-foreground">
              PR #{item.number}: {item.title}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              by @{item.author}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge className={`${getRiskColor(item.riskLevel)} font-mono text-xs`}>
            {item.riskLevel}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">
            {(item.conflictProbability * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}

interface WhatIfSimulatorProps {
  availablePRs: {
    id: string
    number: number
    title: string
    author: string
    riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
    conflictProbability: number
  }[]
  initialQueue?: string[]
  onQueueChange?: (queue: string[]) => void
}

export function WhatIfSimulator({ availablePRs, initialQueue = [], onQueueChange }: WhatIfSimulatorProps) {
  const [queue, setQueue] = useState<string[]>(initialQueue)
  const [showResults, setShowResults] = useState(false)

  const availableItems = availablePRs.filter((pr) => !queue.includes(pr.id))
  const queuedItems = queue.map((id) => availablePRs.find((pr) => pr.id === id)).filter(Boolean) as any[]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const calculateRisk = (items: any[]) => {
    if (items.length < 2) return 0
    let totalRisk = 0
    let pairCount = 0
    items.forEach((item, index) => {
      const laterItems = items.slice(index + 1)
      laterItems.forEach((later) => {
        totalRisk += item.conflictProbability * later.conflictProbability * 0.3
        pairCount++
      })
    }
    return pairCount > 0 ? totalRisk / pairCount : 0
  }

  const currentRisk = calculateRisk(queuedItems)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Determine if dragging within queue or from available to queue
      const wasInQueue = queue.includes(active.id)
      const overInQueue = queue.includes(over.id)

      if (wasInQueue && overInQueue) {
        // Reordering within queue
        setQueue((q) => arrayMove(q, q.indexOf(active.id), q.indexOf(over.id)))
      } else if (!wasInQueue && overInQueue) {
        // Moving from available to queue
        setQueue((q) => arrayMove([...availableItems.map((i) => i.id), ...q], availableItems.findIndex((i) => i.id === active.id), q.indexOf(over.id) + availableItems.length))
      }
    }
  }

  const handleAddToQueue = (prId: string) => {
    if (!queue.includes(prId)) {
      setQueue([...queue, prId])
    }
  }

  const handleRemoveFromQueue = (prId: string) => {
    setQueue(queue.filter((id) => id !== prId))
  }

  const riskLevel = currentRisk >= 0.5 ? 'HIGH' : currentRisk >= 0.25 ? 'MODERATE' : 'LOW'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-mono font-semibold text-foreground">
            What-If Simulator
          </h2>
          <p className="text-sm font-mono text-muted-foreground">
            Build a merge sequence and see predicted conflict risk in real-time.
          </p>
        </div>
        <Badge className={`font-mono px-3 py-1 ${currentRisk >= 0.5 ? 'bg-red-900/50 text-red-300' : currentRisk >= 0.25 ? 'bg-amber-900/50 text-amber-300' : 'bg-green-900/50 text-green-300'}`}>
          Overall Risk: {riskLevel} ({(currentRisk * 100).toFixed(0)}%)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available PRs */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono">Available PRs</CardTitle>
            <CardDescription className="font-mono">
              Drag to add to merge queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {availableItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleAddToQueue(item.id)}
              >
                <span className="text-lg font-mono font-bold text-foreground">
                  #{item.number}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-medium text-foreground truncate">
                    {item.title}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    by @{item.author}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`font-mono text-xs ${['HIGH', 'MODERATE', 'LOW'].includes(item.riskLevel) ? '' : ''}`}>
                    {item.riskLevel}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {(item.conflictProbability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
            {availableItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground font-mono">
                All PRs added to queue
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merge Queue */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono">Merge Queue</CardTitle>
              <Badge className="font-mono">
                {queue.length} PRs
              </Badge>
            </CardTitle>
            <CardDescription className="font-mono">
              Drag to reorder • Predicted risk updates in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event: any) => {
                const { active, over } = event
                if (over && active.id !== over.id) {
                  setQueue((q) => arrayMove(q, q.indexOf(active.id), q.indexOf(over.id)))
                }
              }}
            >
              <SortableContext
                items={queue}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 min-h-[300px]">
                  {queue.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg">
                      <div className="text-4xl mb-2">📥</div>
                      <p className="text-muted-foreground font-mono">
                        Drag PRs here to build merge sequence
                      </p>
                    </div>
                  ) : (
                    queue.map((id, index) => {
                      const item = availablePRs.find((pr) => pr.id === id)!
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-xl font-mono font-bold text-foreground w-8 text-center">
                            {index + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-medium text-foreground truncate">
                              PR #{item.number}: {item.title}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                              by @{item.author}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="font-mono text-xs">
                              {item.riskLevel}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {(item.conflictProbability * 100).toFixed(0)}%
                            </span>
                            <button
                              onClick={() => handleRemoveFromQueue(id)}
                              className="ml-2 p-1 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {queue.length > 0 && (
              <div className="mt-4 p-4 bg-muted/30 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-foreground">
                    Predicted Outcome
                  </span>
                  <Badge className={`font-mono ${
                    currentRisk >= 0.5 ? 'bg-red-900/50 text-red-300' :
                    currentRisk >= 0.25 ? 'bg-amber-900/50 text-amber-300' :
                    'bg-green-900/50 text-green-300'
                  }`}>
                    Risk: {(currentRisk * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                  <div>
                    <div className="text-muted-foreground">Conflicts</div>
                    <div className="font-bold text-foreground">{Math.round(currentRisk * queue.length * 0.5)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">High-Risk Pairs</div>
                    <div className="font-bold text-red-400">
                      {queuedItems.filter((i: any) => i.riskLevel === 'HIGH').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Confidence</div>
                    <div className="font-bold text-green-400">
                      {(queuedItems.reduce((a: number, b: any) => a + b.conflictProbability, 0) / queuedItems.length * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}