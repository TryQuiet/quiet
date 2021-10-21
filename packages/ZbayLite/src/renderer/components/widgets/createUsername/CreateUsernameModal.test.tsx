/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { CreateUsernameModal } from './CreateUsernameModal'

describe('CreateUsernameModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <CreateUsernameModal handleClose={jest.fn()} initialValue={'test'} open={false} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `)
  })
})
