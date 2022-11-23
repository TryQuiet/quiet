import React from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';

import theme from '../theme'


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


export const withStore = store => Story => (
  <Provider store={store}>
    <Story />
  </Provider>
)

export const withTheme = Story => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      <Story />
    </ThemeProvider>
  </StyledEngineProvider>
)
