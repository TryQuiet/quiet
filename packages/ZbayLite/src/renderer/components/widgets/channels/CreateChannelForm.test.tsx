import React from 'react'

import { CreateChannelForm } from './CreateChannelForm'

import { renderComponent } from '../../../testUtils/renderComponent'

describe('CreateChannelForm', () => {
  it.skip('renders component', () => {
    const result = renderComponent(
      <CreateChannelForm
        // onSubmit={jest.fn()}
        setStep={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
