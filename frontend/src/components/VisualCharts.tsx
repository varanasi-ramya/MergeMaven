// Minimal, elegant SVG visualization components in light cream background with popping maroon & brown

import React from 'react'

/**
 * 1. Conflict Probability Gauge (Thin semicircular / radial arc)
 */
export function ProbabilityGauge({
  probability,
  size = 180,
  strokeWidth = 10,
  label = "Conflict Probability",
}: {
  probability: number
  size?: number
  strokeWidth?: number
  label?: string
}) {
  const radius = (size - strokeWidth * 2) / 2
  const center = size / 2
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(probability, 0), 1))
  const percentage = Math.round(probability * 100)

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size / 2 + strokeWidth * 2 }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth * 2}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth * 2}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#561C24" />
              <stop offset="60%" stopColor="#7D4F42" />
              <stop offset="100%" stopColor="#C7B7A3" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Background track */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
            fill="none"
            stroke="rgba(86, 28, 36, 0.14)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active arc fill */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            filter="url(#gaugeGlow)"
          />
        </svg>
        {/* Centered Stat */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 text-center pointer-events-none">
          <span className="text-3xl font-mono font-bold tracking-tight text-burgundy">
            {percentage}%
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-sand font-semibold">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * 2. Overlap Donut Chart
 */
export function OverlapDonut({
  sharedLines = 124,
  prALines = 180,
  prBLines = 145,
  size = 180,
  strokeWidth = 14,
}: {
  sharedLines?: number
  prALines?: number
  prBLines?: number
  size?: number
  strokeWidth?: number
}) {
  const total = sharedLines + prALines + prBLines
  const radius = (size - strokeWidth * 2) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  const sharedPct = total > 0 ? sharedLines / total : 0
  const prAPct = total > 0 ? prALines / total : 0
  const prBPct = total > 0 ? prBLines / total : 0

  const sharedOffset = 0
  const prAOffset = circumference * sharedPct
  const prBOffset = circumference * (sharedPct + prAPct)

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <defs>
            <linearGradient id="donutBurgundy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#561C24" />
              <stop offset="100%" stopColor="#6D2932" />
            </linearGradient>
            <linearGradient id="donutBrown" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7D4F42" />
              <stop offset="100%" stopColor="#9C6B5E" />
            </linearGradient>
            <linearGradient id="donutBeige" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C7B7A3" />
              <stop offset="100%" stopColor="#DDD0C0" />
            </linearGradient>
          </defs>
          {/* Base background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(86, 28, 36, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Segment: Shared Lines (Deep Burgundy) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#donutBurgundy)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * sharedPct} ${circumference}`}
            strokeDashoffset={-sharedOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          {/* Segment: PR A Unique (Warm Brown) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#donutBrown)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * prAPct} ${circumference}`}
            strokeDashoffset={-prAOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          {/* Segment: PR B Unique (Sand/Beige) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#donutBeige)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * prBPct} ${circumference}`}
            strokeDashoffset={-prBOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-mono font-bold text-burgundy">{total}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-sand font-semibold">
            Total Lines
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] font-mono text-sand font-medium w-full px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-burgundy shrink-0 shadow-sm" />
          <span className="truncate">Shared ({sharedLines})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brown-accent shrink-0 shadow-sm" />
          <span className="truncate">PR A ({prALines})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-beige shrink-0 shadow-sm" />
          <span className="truncate">PR B ({prBLines})</span>
        </div>
      </div>
    </div>
  )
}

/**
 * 3. Per-File Overlap Bar Chart (Horizontal sorted bars)
 */
export function FileOverlapBarChart({
  files,
}: {
  files: { path: string; overlap: number; lines?: number }[]
}) {
  const sorted = [...files].sort((a, b) => b.overlap - a.overlap)

  return (
    <div className="space-y-3.5 py-2">
      {sorted.map((file, idx) => {
        const pct = Math.round(file.overlap * (file.overlap > 1 ? 1 : 100))
        return (
          <div key={idx} className="group space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-foreground font-semibold truncate max-w-[280px] md:max-w-md group-hover:text-burgundy transition-colors">
                {file.path}
              </span>
              <div className="flex items-center gap-3">
                {file.lines && (
                  <span className="text-sand text-[11px]">
                    {file.lines} lines
                  </span>
                )}
                <span className="text-burgundy font-bold w-9 text-right">
                  {pct}%
                </span>
              </div>
            </div>
            {/* Progress Bar with Brown to Burgundy gradient */}
            <div className="h-2 w-full bg-card-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brown-accent via-burgundy to-burgundy-light rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 4. Risk Trend / Timeline Chart (Smooth area/line in burgundy & brown)
 */
export function RiskTrendChart({
  data = [
    { day: 'Day 1', risk: 0.15 },
    { day: 'Day 5', risk: 0.28 },
    { day: 'Day 10', risk: 0.42 },
    { day: 'Day 15', risk: 0.58 },
    { day: 'Day 20', risk: 0.74 },
    { day: 'Day 25', risk: 0.87 },
  ],
  height = 140,
}: {
  data?: { day: string; risk: number }[]
  height?: number
}) {
  const width = 460
  const paddingX = 20
  const paddingY = 20
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW
    const y = paddingY + (1 - d.risk) * chartH
    return { x, y, ...d }
  })

  // Create smooth Bezier curve path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="1">
            <stop offset="0%" stopColor="#561C24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#561C24" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid guide lines */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
          stroke="rgba(86, 28, 36, 0.08)"
          strokeDasharray="2 2"
        />
        <line
          x1={paddingX}
          y1={paddingY + chartH / 2}
          x2={width - paddingX}
          y2={paddingY + chartH / 2}
          stroke="rgba(86, 28, 36, 0.08)"
          strokeDasharray="2 2"
        />
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="rgba(86, 28, 36, 0.15)"
        />

        {/* Filled Area */}
        <path d={areaD} fill="url(#areaGradient)" className="transition-all duration-700" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#561C24"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-700"
        />

        {/* Data points */}
        {points.map((pt, i) => (
          <g key={i} className="group">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="#561C24"
              stroke="#FCF7F2"
              strokeWidth="2"
              className="transition-transform duration-200 hover:scale-150"
            />
          </g>
        ))}
      </svg>
      {/* X Labels */}
      <div className="flex justify-between px-2 pt-1 text-[10px] font-mono text-sand font-medium">
        {data.map((d, i) => (
          <span key={i}>{d.day}</span>
        ))}
      </div>
    </div>
  )
}

/**
 * 5. Heatmap Strip (Line range overlap with burgundy and brown opacities)
 */
export function HeatmapStrip({
  ranges = [
    { label: 'Lines 1-40', intensity: 0.1 },
    { label: 'Lines 41-80', intensity: 0.35 },
    { label: 'Lines 81-120', intensity: 0.95 },
    { label: 'Lines 121-160', intensity: 0.8 },
    { label: 'Lines 161-200', intensity: 0.4 },
    { label: 'Lines 201-240', intensity: 0.15 },
    { label: 'Lines 241-280', intensity: 0.65 },
    { label: 'Lines 281-320', intensity: 0.05 },
  ],
}: {
  ranges?: { label: string; intensity: number }[]
}) {
  return (
    <div className="space-y-2 py-2">
      <div className="flex gap-1.5 h-8 w-full rounded-xl overflow-hidden p-1.5 bg-card-elevated border border-border">
        {ranges.map((range, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-md transition-all duration-200 hover:scale-y-110 cursor-pointer relative group"
            style={{
              backgroundColor: range.intensity > 0.6
                ? `rgba(86, 28, 36, ${Math.max(range.intensity, 0.3)})`
                : `rgba(125, 79, 66, ${Math.max(range.intensity, 0.25)})`,
              border: range.intensity > 0.6 ? '1.5px solid #561C24' : 'none',
            }}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
              <div className="bg-foreground text-cream text-[10px] font-mono px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                {range.label}: {Math.round(range.intensity * 100)}% overlap
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-sand font-medium px-1">
        <span>File Start (L1)</span>
        <span className="text-burgundy font-bold">Peak Conflict (L80-140)</span>
        <span>File End</span>
      </div>
    </div>
  )
}

/**
 * 6. Mini Sparkline for Stat Cards
 */
export function MiniSparkline({
  values = [12, 18, 14, 26, 32, 28, 45, 52],
  color = "#561C24",
  width = 64,
  height = 24,
}: {
  values?: number[]
  color?: string
  width?: number
  height?: number
}) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 6) - 3
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

/**
 * 7. Mini Radial Gauge for Stat Cards
 */
export function MiniRadial({
  percent = 87,
  size = 32,
  strokeWidth = 3.5,
}: {
  percent?: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth * 2) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(86, 28, 36, 0.15)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#561C24"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}
