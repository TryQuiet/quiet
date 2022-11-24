import React, { FC, ReactElement } from 'react'
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux'

import { render } from '@testing-library/react'

import theme from '../theme'
import store from '../store'
import { Store } from 'redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'


// declare module '@mui/styles/defaultTheme' {
//   // eslint-disable-next-line @typescript-eslint/no-empty-interface
//   interface DefaultTheme extends Theme {}
// }


type Props = {
  children?: React.ReactNode
}

export const renderComponent = (ui: ReactElement, storeState: Store = store): ReturnType<typeof render> => {
  const Wrapper: FC<Props> = ({ children }) => (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <DndProvider backend={HTML5Backend}>
          <Provider store={storeState}>
            {children}
          </Provider>
        </DndProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  )

  return render(ui, { wrapper: Wrapper })
}
