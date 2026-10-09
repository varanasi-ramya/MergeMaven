"""Merge Order component with drag-and-drop simulator for MergeMaven."""

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

interface MergeOrderItemProps {
  item: PR
  index: number
  isDragging: boolean
  isSelected: boolean
}

function MergeOrderItem({ item, index, isDragging, isSelected }: MergeOrderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
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
      className={`flex items-center gap-4 p-4 bg-card border border-border rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isOver ? 'ring-1 ring-primary/50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono font-bold text-foreground">
            {index + 1}.
          </span>
          <div>
            <div className="font-mono font-semibold text-foreground">
              PR #{item.number}: {item.title}
            </div>
            <div className="text-sm font-mono text-muted-foreground">
              by @{item.author}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-right">
            <div className="text-xs font-mono text-muted-foreground">RISK</div>
            <Badge className={`${getRiskColor(item.riskLevel)} font-mono`}>
              {item.riskLevel}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-muted-foreground">PROBABILITY</div>
            <div className="font-mono font-semibold text-foreground">
              {(item.conflictProbability * 100).toFixed(0)}%
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground/50 cursor-grab">
            ⋮⋮
          </div>
        </div>
      </div>
    )
  }
}

interface MergeOrderProps {
  items: {
    id: string
    number: number
    title: string
    author: string
    riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
    conflictProbability: number
  }[]
  onOrderChange?: (items: any[]) => void
  recommendedOrder?: string[]
}

export function MergeOrder({ items, onOrderChange, recommendedOrder = [] }: MergeOrderProps) {
  const [sortedItems, setSortedItems] = useState(items)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSortedItems((items) => {
        const newItems = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id))
        onOrderChange?.(newItems)
        return newItems
      })
    }
  }

  const calculateRisk = (items: any[]) => {
    let totalRisk = 0
    items.forEach((item, index) => {
      const laterItems = items.slice(index + 1)
      laterItems.forEach((later) => {
        // Simplified risk calculation
        totalRisk += item.conflictProbability * later.conflictProbability * 0.5
      })
    })
    return Math.min(1, totalRisk / items.length)
  }

  const currentRisk = calculateRisk(sortedItems)
  const recommendedRisk = calculateRisk(
    recommendedOrder
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-mono font-semibold text-foreground">
            Merge Order
          </h2>
          <p className="text-sm font-mono text-muted-foreground">
            Drag to reorder • Current risk: <span className="font-bold text-foreground">{(currentRisk * 100).toFixed(0)}%</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-mono"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Hide Comparison' : 'Compare with Recommended'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-mono"
            onClick={() => {
              const recommended = recommendedOrder
                .map((id) => items.find((i) => i.id === id))
                .filter(Boolean)
              setSortedItems(recommended as any)
              onOrderChange?.(recommended as any)
            }}
          >
            Apply Recommended
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sortedItems.map((item, index) => (
              <MergeOrderItem
                key={item.id}
                item={item}
                index={index}
                isDragging={false}
                isSelected={selectedId === item.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showComparison && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="font-mono font-semibold text-foreground mb-3">
            Comparison with Recommended Order
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
              <div className="font-mono font-semibold text-red-400 mb-2">
                Your Order
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                Risk: <span className="font-bold text-red-400">{(currentRisk * 100).toFixed(0)}%</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm font-mono text-muted-foreground">
                {sortedItems.slice(0, 5).map((item, i) => (
                  <li key={item.id}>
                    {i + 1}. PR #{item.number} ({item.riskLevel})
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 bg-green-900/20 border border-green-900/30 rounded-lg">
              <div className="font-mono font-semibold text-green-400 mb-2">
                Recommended Order
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                Risk: <span className="font-bold text-green-400">{(recommendedRisk * 100).toFixed(0)}%</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm font-mono text-muted-foreground">
                {recommendedOrder
                  .map((id) => items.find((i) => i.id === id))
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((item, i) => (
                    <li key={item!.id}>
                      {i + 1}. PR #{item!.number} ({item!.riskLevel})
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}