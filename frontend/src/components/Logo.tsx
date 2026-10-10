import React from 'react'

interface LogoProps {
  size?: number
  className?: string
}

/**
 * MergeMaven logo — black background, white icon, rounded corners.
 * The image is centered and cropped from its center using object-center.
 */
export function Logo({ size = 52, className = '' }: LogoProps) {
  return (
    <img
      src="/logo-icon.png"
      alt="MergeMaven"
      // Center the image horizontally and crop from its center
      className={`mx-auto block rounded-xl object-cover object-center ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
