import React from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import { defaultTheme } from '../theme'
import { Store } from '../sagas/store.types'

const theme = defaultTheme

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
