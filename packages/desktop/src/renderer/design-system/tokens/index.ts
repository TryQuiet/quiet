import { createContext, useContext } from 'react'

import { grid4px } from './grid-4px'
import { Tokens } from './types'

export * from './types'
export { grid4px }

/** The design system's token set: 4px grid, Rubik scale. */
export const tokens: Tokens = grid4px

const TokensContext = createContext<Tokens>(tokens)
export const TokensProvider = TokensContext.Provider
export const useTokens = (): Tokens => useContext(TokensContext)
