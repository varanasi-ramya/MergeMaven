"""Interactive Conflict Graph using D3.js for MergeMaven."""

import { useEffect, useRef, useState } from 'react'

import * as d3 from 'd3'

interface GraphNode {
  id: string
  label: string
  prNumber: number
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
  conflictCount: number
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphLink {
  source: string
  target: string
  probability: number
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW'
}

interface ConflictGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick?: (node: GraphNode) => void
  onLinkClick?: (link: GraphLink) => void
  width?: number
  height?: number
}

export function ConflictGraph({
  nodes,
  links,
  onNodeClick,
  onLinkClick,
  width = 800,
  height = 600,
}: ConflictGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return '#dc2626'
      case 'MODERATE':
        return '#d97706'
      case 'LOW':
        return '#16a34a'
      default:
        return '#6b7280'
    }
  }

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'rgba(220, 38, 38, 0.2)'
      case 'MODERATE':
        return 'rgba(217, 119, 6, 0.2)'
      case 'LOW':
        return 'rgba(22, 163, 74, 0.2)'
      default:
        return 'rgba(107, 114, 128, 0.2)'
    }
  }

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svg.append('g')
      .attr('transform', 'translate(40, 40)')

    // Create the simulation
    const forceSimulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2 - 40, height / 2 - 40))
      .force('collision', d3.forceCollide().radius(60))

    setSimulation(forceSimulation)

    // Links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => getRiskColor(d.riskLevel))
      .attr('stroke-width', (d: any) => Math.max(1, d.probability * 3))
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        onLinkClick?.(d)
      })

    // Link labels
    const linkLabel = container.append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-family', '"IBM Plex Mono", monospace')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .attr('dy', '-2px')
      .text((d: any) => `${(d.probability * 100).toFixed(0)}%`)
      .attr('pointer-events', 'none')

    // Nodes
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.vx = 0
          d.vy = 0
        })
        .on('drag', (event, d) => {
          d.vx = event.x - d.x!
          d.vy = event.y - d.y!
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.vx = 0
          d.vy = 0
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(d)
        onNodeClick?.(d)
      })

    // Node circles
    node.append('circle')
      .attr('r', (d: any) => Math.max(25, Math.min(50, 20 + d.conflictCount * 5)))
      .attr('fill', (d: any) => getRiskBgColor(d.riskLevel))
      .attr('stroke', (d: any) => getRiskColor(d.riskLevel))
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d: any) => d.id === selectedNode?.id ? '8,4' : 'none')

    // Node labels
    node.append('text')
      .attr('class', 'node-label')
      .attr('font-family', '"IBM Plex Mono", monospace')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#e8d8c4')
      .attr('text-anchor', 'middle')
      .attr('dy', '4px')
      .text((d: any) => `#${d.prNumber}`)

    // Conflict count badge
    node.append('text')
      .attr('class', 'conflict-count')
      .attr('font-family', '"IBM Plex Mono", monospace')
      .attr('font-size', '9px')
      .attr('fill', '#9ca3af')
      .attr('text-anchor', 'middle')
      .attr('dy', '18px')
      .text((d: any) => `${d.conflictCount} conflicts`)

    // Tick function
    forceSimulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x!)
        .attr('y1', (d: any) => d.source.y!)
        .attr('x2', (d: any) => d.target.x!)
        .attr('y2', (d: any) => d.target.y!)

      linkLabel
        .attr('x', (d: any) => (d.source.x! + d.target.x!) / 2)
        .attr('y', (d: any) => (d.source.y! + d.target.y!) / 2)

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      forceSimulation.stop()
    }
  }, [nodes, links, width, height, onNodeClick, onLinkClick, selectedNode])

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-4 p-3 bg-card/90 border border-border rounded-lg">
        {['HIGH', 'MODERATE', 'LOW'].map(risk => (
          <div key={risk} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getRiskColor(risk) }}
            />
            <span className="text-xs font-mono text-muted-foreground">{risk}</span>
          </div>
        ))}
      </div>

      {/* Selected Node Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-64 p-4 bg-card border border-border rounded-lg shadow-lg z-10">
          <div className="font-mono font-semibold text-foreground mb-2">
            PR #{selectedNode.prNumber}
          </div>
          <div className="text-sm font-mono text-muted-foreground mb-3">
            {selectedNode.conflictCount} conflicts
          </div>
          <div className="flex gap-1 mb-3">
            <span className={`px-2 py-1 text-xs font-mono rounded ${getRiskColor(selectedNode.riskLevel)}/20 text-${selectedNode.riskLevel === 'HIGH' ? 'red' : selectedNode.riskLevel === 'MODERATE' ? 'amber' : 'green'}-400 border border-${selectedNode.riskLevel === 'HIGH' ? 'red' : selectedNode.riskLevel === 'MODERATE' ? 'amber' : 'green'}-500`}>
              {selectedNode.riskLevel}
            </span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="w-full text-sm font-mono text-primary hover:text-primary/80"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  )
}