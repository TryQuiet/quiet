import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { DeleteChannel } from './DeleteChannel.component'

describe('DeleteChannel component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <DeleteChannel name={'general'} deleteChannel={jest.fn()} handleBackButton={jest.fn()} />
    )

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
