// Interactive Conflict Graph using D3.js with light cream background and popping maroon & brown nodes.

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
  source: string | GraphNode
  target: string | GraphNode
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
  height = 500,
}: ConflictGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return '#561C24' // deep burgundy
      case 'MODERATE':
        return '#7D4F42' // warm brown
      case 'LOW':
        return '#A88C7D' // sand brown
      default:
        return '#6D2932'
    }
  }

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return '#561C24'
      case 'MODERATE':
        return '#7D4F42'
      case 'LOW':
        return '#C7B7A3'
      default:
        return '#6D2932'
    }
  }

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Container with zoom
    const container = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Defs for filters
    const defs = svg.append('defs')
    const filter = defs.append('filter')
      .attr('id', 'nodeShadow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%')

    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('stdDeviation', '4')
      .attr('flood-color', 'rgba(86, 28, 36, 0.25)')

    // Simulation
    const nodeData = nodes.map(d => ({ ...d }))
    const linkData = links.map(d => ({ ...d }))

    const sim = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData).id((d: any) => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))

    // Links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(linkData)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => d.probability > 0.7 ? '#561C24' : '#C7B7A3')
      .attr('stroke-width', (d: any) => Math.max(d.probability * 3.5, 1.5))
      .attr('stroke-opacity', 0.85)
      .attr('stroke-dasharray', (d: any) => d.probability < 0.4 ? '4,4' : 'none')
      .style('cursor', 'pointer')
      .on('click', (_, d) => onLinkClick?.(d))

    // Node groups
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodeData)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (_, d) => {
        setSelectedNode(d)
        onNodeClick?.(d)
      })

    // Outer node circle
    node.append('circle')
      .attr('r', 22)
      .attr('fill', (d) => getRiskBg(d.riskLevel))
      .attr('stroke', '#FAF3EC')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#nodeShadow)')

    // PR Number Text inside node
    node.append('text')
      .text((d) => `#${d.prNumber}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '700')

    // PR Label below node
    node.append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '34px')
      .attr('fill', '#2A1714')
      .attr('font-size', '11px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '600')

    // Tick update
    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      sim.stop()
    }
  }, [nodes, links, width, height])

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="text-base text-burgundy font-bold">Repository Conflict Graph</CardTitle>
            <CardDescription className="text-xs font-mono text-sand">
              Interactive node network of active PRs and collision edges
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-sand font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-burgundy shadow-sm" />
              <span className="font-semibold text-foreground">High Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brown-accent shadow-sm" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-beige shadow-sm" />
              <span>Low</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative">
          <svg
            ref={svgRef}
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full bg-[#FAF3EC]/60"
          />

          {selectedNode && (
            <div className="absolute bottom-4 left-4 p-4 rounded-xl bg-card border border-border text-xs font-mono max-w-xs shadow-xl ring-1 ring-burgundy/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-burgundy">PR #{selectedNode.prNumber}</span>
                <Badge variant={selectedNode.riskLevel.toLowerCase() as any} className="text-[10px]">
                  {selectedNode.riskLevel}
                </Badge>
              </div>
              <p className="text-foreground font-sans font-medium text-[11px] mb-2">{selectedNode.label}</p>
              <div className="text-[10px] text-sand font-medium">
                Connected Conflicts: {selectedNode.conflictCount}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}