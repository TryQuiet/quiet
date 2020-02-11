import React from 'react'
import { shallow } from 'enzyme'
import { DateTime } from 'luxon'
import { now } from '../../../../testUtils'

import { mockClasses } from '../../../../../shared/testing/mocks'
import { InviteMentionInfo } from './InviteMentionInfo'

describe('InviteMentionInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })
  it('renders component', () => {
    const result = shallow(
      <InviteMentionInfo
        classes={mockClasses}
        handleClose={jest.fn()}
        handleInvite={jest.fn()}
        nickname='test'
        timeStamp={0}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
