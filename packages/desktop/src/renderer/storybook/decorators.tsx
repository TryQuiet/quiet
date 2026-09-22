import React from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { lightTheme } from '../theme'
import { Store } from '../sagas/store.types'

const theme = lightTheme

export const withStore = (store: Store) => (Story: React.FC) => (
  <Provider store={store}>
    <Story />
  </Provider>
)

export const withTheme = (Story: React.FC) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      <Story />
    </ThemeProvider>
  </StyledEngineProvider>
)

/** Components that accept dropped files (the channel and new-DM views) need react-dnd's context. */
export const withDragDrop = (Story: React.FC) => (
  <DndProvider backend={HTML5Backend}>
    <Story />
  </DndProvider>
)
