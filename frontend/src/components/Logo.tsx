import React from 'react'

interface LogoProps {
  size?: number
  className?: string
}

/**
 * MergeMaven logo — black background, white icon, rounded corners.
 * Used both on the landing screen and in the dashboard header.
 */
export function Logo({ size = 52, className = '' }: LogoProps) {
  return (
    <img
      src="/logo-icon.png"
      alt="MergeMaven"
      className={`shrink-0 rounded-xl object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
