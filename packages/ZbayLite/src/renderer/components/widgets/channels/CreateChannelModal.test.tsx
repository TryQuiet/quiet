import React from 'react'

import { CreateChannelModal } from './CreateChannelModal'
import { renderComponent } from '../../../testUtils/renderComponent'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../../store'

describe('CreateChannelModal', () => {
  it.skip('renders component', () => {
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <CreateChannelModal handleClose={jest.fn()} open />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })

  it.skip('renders closed component', () => {
    const result = renderComponent(<CreateChannelModal handleClose={jest.fn()} open={true} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `)
  })
})
