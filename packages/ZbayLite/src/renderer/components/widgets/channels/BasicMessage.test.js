import React from 'react'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { BasicMessage } from './BasicMessage'
import { ZcashError } from '../../../store/handlers/operations'
import { mockClasses } from '../../../../shared/testing/mocks'
import { now, createMessage } from '../../../testUtils'
import { DisplayableMessage } from '../../../zbay/messages'

describe('BasicMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const message = createMessage(1)
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when message is sent by owner', () => {
    const message = createMessage(1)
    message.fromYou = true

    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for same week', () => {
    const message = createMessage(1, now.minus({ days: 1 }).toSeconds())
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different month', () => {
    const message = createMessage(1, now.minus({ month: 1 }).toSeconds())
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different year', () => {
    const message = createMessage(1, now.minus({ year: 1 }).toSeconds())
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with status failed', () => {
    const message = {
      ...createMessage,
      status: 'failed',
      createdAt: 1603231234,
      error: {
        ...ZcashError,
        code: -2,
        message: 'This is some kind of error message'
      }
    }
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    )
    expect(result).toMatchSnapshot()
  })
})
