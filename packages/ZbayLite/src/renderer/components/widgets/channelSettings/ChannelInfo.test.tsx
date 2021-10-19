
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { ChannelInfo } from './ChannelInfo'

describe('ChannelInfo', () => {
  it.skip('renders component', () => {
    const result = renderComponent(
      <ChannelInfo
        initialValues={{
          updateChannelDescription: ''
        }}
        updateChannelSettings={() => { }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
