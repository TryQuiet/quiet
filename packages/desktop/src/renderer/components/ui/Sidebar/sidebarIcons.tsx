import React from 'react'

/**
 * The sidebar's glyphs, exported from the Quiet Design Library
 * (`0j7Nna9zWmfOSNmRmQK1Uh`) as SVG and transcribed verbatim: only `white` was
 * swapped for `currentColor`, and the library's `<g opacity>` wrapper dropped so
 * the opacity lives in one place — `sidebarMetrics.opacity` — where hover can
 * raise it.
 */

/** `st-person-add-2` — the "Add members" glyph, drawn in a 12px box. */
export const PersonAddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width='12' height='12' viewBox='0 0 12 12' fill='none' className={className} aria-hidden focusable='false'>
    <circle cx='4.5' cy='4' r='1.5' stroke='currentColor' />
    <path d='M9.5 3.5C9.5 4.67157 9.5 6.5 9.5 6.5' stroke='currentColor' strokeWidth='0.75' strokeLinecap='round' />
    <path d='M11 5C9.82843 5 8 5 8 5' stroke='currentColor' strokeWidth='0.75' strokeLinecap='round' />
    <path
      d='M7.82375 8.77097C7.2907 7.40505 5.66103 6.86719 4.5 6.86719C3.33611 6.86719 1.70127 7.3863 1.17233 8.77001C0.975132 9.28589 1.44742 9.75 1.99971 9.75H4.5H7.00012C7.5524 9.75 8.02453 9.28547 7.82375 8.77097Z'
      stroke='currentColor'
    />
  </svg>
)

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

/** `search` — the magnifier inside the search input. */
export const SearchGlyphIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className={className} aria-hidden focusable='false'>
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M9.80667 9.33333H10.3333L13.66 12.6667L12.6667 13.66L9.33333 10.3333V9.80667L9.15333 9.62C8.39333 10.2733 7.40667 10.6667 6.33333 10.6667C3.94 10.6667 2 8.72667 2 6.33333C2 3.94 3.94 2 6.33333 2C8.72667 2 10.6667 3.94 10.6667 6.33333C10.6667 7.40667 10.2733 8.39333 9.62 9.15333L9.80667 9.33333ZM3.33333 6.33333C3.33333 7.99333 4.67333 9.33333 6.33333 9.33333C7.99333 9.33333 9.33333 7.99333 9.33333 6.33333C9.33333 4.67333 7.99333 3.33333 6.33333 3.33333C4.67333 3.33333 3.33333 4.67333 3.33333 6.33333Z'
      fill='currentColor'
    />
  </svg>
)
