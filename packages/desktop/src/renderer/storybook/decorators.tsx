import React from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'

import theme from '../theme'

export const withStore = store => Story => (
  <Provider store={store}>
    <Story />
  </Provider>
)

export const withTheme = Story => (
  <ThemeProvider theme={theme}>
    <Story />
  </ThemeProvider>
)
