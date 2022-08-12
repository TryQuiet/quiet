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
        date={'1:55pm'}
        unread={false}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot()
  })

  it('should match inline snapshot (unread)', () => {
    const { toJSON } = renderComponent(
      <ChannelTile
        name={'general'}
        message={
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
        }
        date={'1:55pm'}
        unread={true}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
