import React from 'react'
import { shallow } from 'enzyme'
import theme from '../../../theme'

import { ChannelsListItem } from './ChannelsListItem'
import { createChannel } from '../../../testUtils'
import { mockClasses } from '../../../../shared/testing/mocks'

const appContext = React.createContext()

describe('ChannelsListItem', () => {
  const privateChannel = createChannel(1)
  const publicChannel = createChannel(0)

  it('renders component', () => {
    const result = shallow(
      <appContext theme={theme}>
        <ChannelsListItem
          classes={mockClasses}
          channel={{
            ...privateChannel,
            newMessages: []
          }}
          selected={{}}
          isRegisteredUsername
        />
      </appContext>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with address', () => {
    const result = shallow(
      <appContext theme={theme}>
        <ChannelsListItem
          classes={mockClasses}
          channel={{
            ...privateChannel,
            newMessages: []
          }}
          displayAddress
          selected={{}}
          isRegisteredUsername
        />
      </appContext>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when public', () => {
    const result = shallow(
      <appContext theme={theme}>
        <ChannelsListItem
          classes={mockClasses}
          channel={{
            ...publicChannel,
            newMessages: []
          }}
          selected={{}}
          isRegisteredUsername
        />
      </appContext>
    )
    expect(result).toMatchSnapshot()
  })
})
