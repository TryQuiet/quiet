import React from 'react'
import * as R from 'ramda'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { now, createMessage } from './testUtils'
import { ChannelMessages } from './ChannelMessages'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelMessages', () => {
  it('renders component', () => {
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const messages = R.range(0, 4).map(createMessage)
    const ref = React.createRef()
    const contentRect = {
      bounds: {
        height: 200
      }
    }

    const result = shallow(
      <ChannelMessages
        classes={mockClasses}
        messages={messages}
        measureRef={ref}
        contentRect={contentRect}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
