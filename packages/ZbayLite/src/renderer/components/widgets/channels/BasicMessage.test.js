import React from 'react'
import Immutable from 'immutable'
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
    const message = Immutable.fromJS(createMessage(1))
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component when message is sent by owner', () => {
    const message = Immutable.fromJS(createMessage(1)).set('fromYou', true)

    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for same week', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ days: 1 }).toSeconds()))
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different month', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ month: 1 }).toSeconds()))
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders correct time for different year', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ year: 1 }).toSeconds()))
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders username', () => {
    const message = Immutable.fromJS(createMessage(1, now.minus({ hours: 2 }).toSeconds())).update(
      m => m.set(['sender', 'username'], 'Saturn')
    )
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  each(['pending', 'success', 'cancelled']).test('renders with status %s', status => {
    const message = Immutable.fromJS(createMessage(1)).update(m => m.set('status', status))
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        onResend={jest.fn()}
        onReply={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with status failed', () => {
    const message = Immutable.fromJS(createMessage(1))
      .set('status', 'failed')
      .set(
        'error',
        ZcashError({
          code: -2,
          message: 'This is some kind of error message'
        })
      )
    const result = shallow(
      <BasicMessage
        classes={mockClasses}
        message={DisplayableMessage(message)}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
