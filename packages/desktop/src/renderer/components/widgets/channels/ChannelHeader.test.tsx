import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelHeaderComponent } from './ChannelHeader'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ChannelHeaderComponent
        channelName='general'
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
