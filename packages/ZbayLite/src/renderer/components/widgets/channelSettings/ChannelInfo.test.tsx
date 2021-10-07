
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { ChannelInfo } from './ChannelInfo'

describe('ChannelInfo', () => {
  it.skip('renders component', () => {
    const result = renderComponent(
      <ChannelInfo
        initialValues={{
          updateChannelDescription: '',
          updateMinFee: false
        }}
        updateChannelSettings={() => { }}
        rateZec={1}
        rateUsd={1}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
