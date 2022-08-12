import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelList } from './ChannelList.component'

describe('ChannelList component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <ChannelList
        tiles={[
          {
            name: 'general',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '1:55pm',
            unread: false
          },
          {
            name: 'spam',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '1:55pm',
            unread: false
          },
          {
            name: 'design',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: '6/1/22',
            unread: true
          },
          {
            name: 'qa',
            message:
              'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
            date: 'Yesterday',
            unread: false
          }
        ]}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
