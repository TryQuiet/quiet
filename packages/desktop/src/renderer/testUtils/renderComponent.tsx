import React, { FC, ReactElement } from 'react'
import { MuiThemeProvider } from '@material-ui/core'
import { Provider } from 'react-redux'

import { render } from '@testing-library/react'

import theme from '../theme'
import store from '../store'
import { Store } from 'redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export const renderComponent = (ui: ReactElement, storeState: Store = store): ReturnType<typeof render> => {
  const Wrapper: FC = ({ children }) => (
    <DndProvider backend={HTML5Backend}>
    <MuiThemeProvider theme={theme}>
      <Provider store={storeState}>
        {children}
      </Provider>
    </MuiThemeProvider>
    </DndProvider>
  )

  return render(ui, { wrapper: Wrapper })
}
