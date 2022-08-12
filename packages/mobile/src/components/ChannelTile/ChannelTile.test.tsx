import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelTile } from './ChannelTile.component'

describe('ChannelList component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        message={
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
        }
      />
    )

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
