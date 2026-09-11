import React, { createContext, useContext } from 'react'

import { current } from './current'
import { grid2px } from './grid-2px'
import { grid4px } from './grid-4px'
import { GridName, Tokens } from './types'

export * from './types'
export { current, grid2px, grid4px }

export const GRIDS: Record<GridName, Tokens> = {
  '2px': grid2px,
  '4px': grid4px,
}

/**
 * Which grid a story renders under. Driven by the Storybook toolbar
 * (see .storybook/preview.tsx), so every story reacts live to the switch.
 */
const GridContext = createContext<Tokens>(grid4px)

export const GridProvider: React.FC<{ grid: GridName; children: React.ReactNode }> = ({ grid, children }) =>
  React.createElement(GridContext.Provider, { value: GRIDS[grid] ?? grid4px }, children)

export const useTokens = (): Tokens => useContext(GridContext)
