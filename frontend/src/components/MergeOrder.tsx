// Merge Order component with drag-and-drop recommendation sequence on light background.

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
import { GripVertical, GitMerge, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

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
}

function MergeOrderItem({ item, index, isDragging }: MergeOrderItemProps) {
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
      className={`flex items-center gap-3.5 p-4 rounded-xl bg-card border transition-all duration-150 shadow-sm ${
        isDragging
          ? 'border-burgundy shadow-xl bg-card-elevated ring-2 ring-burgundy/30'
          : 'border-border hover:border-burgundy/40'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-sand hover:text-burgundy transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-7 h-7 rounded-full bg-burgundy text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs font-bold text-burgundy">
            PR #{item.number}
          </span>
          <span className="text-[10px] font-mono text-sand">
            @{item.author}
          </span>
        </div>
        <p className="text-xs text-foreground font-medium truncate font-sans">
          {item.title}
        </p>
      </div>

      <Badge variant={getRiskBadgeVariant(item.riskLevel) as any} className="text-[10px]">
        {(item.conflictProbability * 100).toFixed(0)}% RISK
      </Badge>
    </div>
  )
}


const MOCK_MERGE_ORDER: PR[] = [
  { id: '1', number: 139, title: 'Update API endpoints', author: 'eve', riskLevel: 'LOW', conflictProbability: 0.18 },
  { id: '2', number: 148, title: 'Add Stripe integration', author: 'david', riskLevel: 'MODERATE', conflictProbability: 0.58 },
  { id: '3', number: 145, title: 'Refactor checkout flow', author: 'charlie', riskLevel: 'MODERATE', conflictProbability: 0.64 },
  { id: '4', number: 147, title: 'Update transaction model', author: 'bob', riskLevel: 'HIGH', conflictProbability: 0.82 },
  { id: '5', number: 142, title: 'Add payment validation', author: 'alice', riskLevel: 'HIGH', conflictProbability: 0.87 },
]

interface MergeOrderEntry {
  prNumber: number
  title: string
  conflictScore: number
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
}

export function MergeOrder({ onOrderChange, mergeOrder: liveMergeOrder }: { onOrderChange?: (items: PR[]) => void; mergeOrder?: MergeOrderEntry[] }) {
  const initialItems: PR[] = liveMergeOrder && liveMergeOrder.length > 0
    ? liveMergeOrder.map((entry, i) => ({
        id: String(i + 1),
        number: entry.prNumber,
        title: entry.title,
        author: '',
        riskLevel: entry.riskLevel,
        conflictProbability: entry.conflictScore,
      }))
    : MOCK_MERGE_ORDER
  const [sortedItems, setSortedItems] = useState<PR[]>(initialItems)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSortedItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        onOrderChange?.(reordered)
        return reordered
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card border border-border p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="font-sans font-bold text-base text-burgundy">
              Optimal Merge Order Recommendation
            </h3>
            <p className="text-xs font-mono text-sand mt-0.5">
              Algorithmically ordered to minimize cascading rebases and downstream branch conflicts
            </p>
          </div>
          <Badge variant="low" className="text-xs self-start sm:self-auto font-bold text-burgundy">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-burgundy" />
            Confidence: 94%
          </Badge>
        </div>

        {/* Sortable List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {sortedItems.map((item, index) => (
                <MergeOrderItem
                  key={item.id}
                  item={item}
                  index={index}
                  isDragging={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Impact Insight */}
        <div className="p-4 rounded-xl bg-card-elevated border border-border flex items-start gap-3 text-xs font-mono shadow-sm">
          <GitMerge className="w-4 h-4 text-burgundy mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="text-burgundy font-bold">Merge Plan Rationale</span>
            <p className="text-[11px] text-foreground leading-relaxed font-medium">
              Merging foundational endpoint changes (PR #139) first establishes updated schema models before feature PRs (#148, #145) touch dependent payment handlers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}