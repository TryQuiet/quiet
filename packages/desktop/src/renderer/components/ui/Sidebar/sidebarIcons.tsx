import React from 'react'

/**
 * The sidebar's glyphs, exported from the Quiet Design Library
 * (`0j7Nna9zWmfOSNmRmQK1Uh`) as SVG and transcribed verbatim: only `white` was
 * swapped for `currentColor`, and the library's `<g opacity>` wrapper dropped so
 * the opacity lives in one place — `sidebarMetrics.opacity` — where hover can
 * raise it.
 */

/** `t-caret-down-dark` — the caret beside the community name. */
export const CaretDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className={className} aria-hidden focusable='false'>
    <path
      d='M11.5246 7.09375H4.47265C4.2937 7.09375 4.20482 7.31075 4.33234 7.43628L7.84462 10.8937C7.92224 10.9701 8.04674 10.9703 8.12467 10.8942L11.6644 7.43683C11.7927 7.31153 11.704 7.09375 11.5246 7.09375Z'
      fill='currentColor'
    />
  </svg>
)

/** `t-add` — the (+) at a section header's right edge. */
export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className={className} aria-hidden focusable='false'>
    <path d='M8 4V12' stroke='currentColor' />
    <path d='M12 8L4 8' stroke='currentColor' />
    <circle cx='8' cy='8' r='7.5' stroke='currentColor' />
  </svg>
)
