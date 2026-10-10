// What-If Simulator component for MergeMaven merge order experimentation on light background.

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Minus, RotateCcw, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MiniRadial } from '@/components/VisualCharts'

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
  onAction?: () => void
}

function SimulatorItem({ item, index, isDragging, isInQueue, onAction }: SimulatorItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'high'
      case 'MODERATE':
        return 'moderate'
      case 'LOW':
        return 'low'
      default:
        return 'default'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3.5 rounded-xl bg-card border transition-all duration-150 shadow-sm ${
        isDragging
          ? 'border-burgundy shadow-xl bg-card-elevated ring-2 ring-burgundy/30'
          : 'border-border hover:border-burgundy/40'
      }`}
    >
      {isInQueue && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-sand hover:text-burgundy transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {isInQueue && (
        <span className="w-6 h-6 rounded-full bg-burgundy text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm">
          {index + 1}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs font-bold text-burgundy">
            PR #{item.number}
          </span>
          <span className="text-[10px] font-mono text-sand font-medium">
            @{item.author}
          </span>
        </div>
        <p className="text-xs text-foreground truncate font-sans font-medium">
          {item.title}
        </p>
      </div>

      <Badge variant={getRiskBadgeVariant(item.riskLevel) as any} className="text-[10px] shrink-0">
        {Math.round(item.conflictProbability * 100)}% RISK
      </Badge>

      {onAction && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onAction}
          className="h-7 w-7 text-sand hover:text-burgundy hover:bg-card-elevated"
        >
          {isInQueue ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </Button>
      )}
    </div>
  )
}

const mockPRs: PR[] = [
  { id: '1', number: 142, title: 'Add payment validation', author: 'alice', riskLevel: 'HIGH', conflictProbability: 0.87 },
  { id: '2', number: 147, title: 'Update transaction model', author: 'bob', riskLevel: 'HIGH', conflictProbability: 0.82 },
  { id: '3', number: 145, title: 'Refactor checkout flow', author: 'charlie', riskLevel: 'MODERATE', conflictProbability: 0.64 },
  { id: '4', number: 148, title: 'Add Stripe integration', author: 'david', riskLevel: 'MODERATE', conflictProbability: 0.58 },
  { id: '5', number: 139, title: 'Update API endpoints', author: 'eve', riskLevel: 'LOW', conflictProbability: 0.18 },
]

export function WhatIfSimulator() {
  const [queue, setQueue] = useState<string[]>(['2', '1', '4'])
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const queuedItems = queue.map((id) => mockPRs.find((pr) => pr.id === id)!).filter(Boolean)
  const availableItems = mockPRs.filter((pr) => !queue.includes(pr.id))

  const calculateRisk = (items: PR[]) => {
    if (items.length <= 1) return 0.05
    let totalRisk = 0
    let pairCount = 0
    items.forEach((item, index) => {
      const laterItems = items.slice(index + 1)
      laterItems.forEach((later) => {
        const avg = (item.conflictProbability + later.conflictProbability) / 2
        const penalty = (index + 1) * 0.04
        totalRisk += Math.max(0, avg - penalty)
        pairCount++
      })
    })
    return pairCount > 0 ? totalRisk / pairCount : 0
  }

  const currentRisk = calculateRisk(queuedItems)

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const activeIdStr = String(active.id)
      const overIdStr = String(over.id)
      const wasInQueue = queue.includes(activeIdStr)
      const overInQueue = queue.includes(overIdStr)

      if (wasInQueue && overInQueue) {
        setQueue((q) => arrayMove(q, q.indexOf(activeIdStr), q.indexOf(overIdStr)))
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

  const handleReset = () => {
    setQueue(['2', '1', '4'])
  }

  const handleOptimize = () => {
    const sorted = [...queuedItems].sort((a, b) => a.conflictProbability - b.conflictProbability)
    setQueue(sorted.map(s => s.id))
  }

  return (
    <div className="space-y-6">
      {/* Header and Risk Simulation Card */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-lg font-sans font-bold text-burgundy">
            Merge Order What-If Simulator
          </h3>
          <p className="text-xs font-mono text-sand mt-1 max-w-lg">
            Reorder the simulated merge queue to evaluate cumulative conflict risk and optimize merge flow.
          </p>
        </div>

        {/* Live Simulated Risk Gauge */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-card-elevated border border-border self-stretch md:self-auto shadow-sm">
          <MiniRadial percent={Math.round(currentRisk * 100)} size={48} strokeWidth={4} />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-sand font-bold">
              SIMULATED RISK SCORE
            </div>
            <div className="text-2xl font-mono font-bold text-burgundy">
              {(currentRisk * 100).toFixed(1)}%
            </div>
          </div>
          <div className="pl-4 border-l border-border flex flex-col gap-1.5">
            <Button size="sm" variant="default" onClick={handleOptimize} className="h-7 text-xs shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Auto-Optimize
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} className="h-6 text-[11px] text-sand hover:text-burgundy">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Columns: Queue vs Available */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Merge Queue */}
        <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-sans font-bold text-sm text-burgundy">
                Active Merge Sequence
              </h4>
              <Badge variant="outline" className="text-[10px] font-bold">
                {queuedItems.length} in queue
              </Badge>
            </div>
            <span className="text-[11px] font-mono text-sand">
              Drag to reorder
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={queue} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5 min-h-[160px]">
                {queuedItems.map((item, index) => (
                  <SimulatorItem
                    key={item.id}
                    item={item}
                    index={index}
                    isDragging={activeId === item.id}
                    isInQueue={true}
                    onAction={() => handleRemoveFromQueue(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Right: Available PRs */}
        <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="font-sans font-bold text-sm text-burgundy">
              Available Open PRs
            </h4>
            <span className="text-[11px] font-mono text-sand font-medium">
              {availableItems.length} ready
            </span>
          </div>

          <div className="space-y-2.5">
            {availableItems.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-sand">
                All pull requests are added to merge queue.
              </div>
            ) : (
              availableItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card-elevated border border-border shadow-sm"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-xs font-bold text-burgundy">
                      PR #{item.number}
                    </span>
                    <p className="text-xs text-foreground font-medium truncate">{item.title}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToQueue(item.id)}
                    className="h-7 text-xs shrink-0 text-foreground hover:text-burgundy border-border"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-burgundy" />
                    Enqueue
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}