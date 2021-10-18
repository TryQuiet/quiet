import React from 'react'
import { NewMessageModal } from './NewMessageModal'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('NewMessageModal', () => {
  it.skip('renders NewMessageModal', () => {
    const users = {}
    const result = renderComponent(
      <NewMessageModal handleClose={jest.fn()} sendMessage={jest.fn()} open users={users} />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
