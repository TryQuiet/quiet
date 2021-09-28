import React from 'react'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { BasicMessage } from './BasicMessage'
import { now, createMessage } from '../../../testUtils'
import { MuiThemeProvider } from '@material-ui/core/styles'

import theme from '../../../theme'
import { DisplayableMessage } from '../../../zbay/messages.types'

describe('BasicMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  const wrapper = el => <MuiThemeProvider theme={theme}>{el}</MuiThemeProvider>

  it('renders component', async () => {
    const message = await createMessage()
    const displayMessage = new DisplayableMessage(message)
    const result = shallow(wrapper(
      <BasicMessage
        message={displayMessage}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    ))
    expect(result).toMatchSnapshot()
  })

  it('renders component when message is sent by owner', async () => {
    const message = await createMessage()
    const messageFromYou = {
      ...message,
      fromYou: true
    }
    const displayMessage = new DisplayableMessage(messageFromYou)
    const result = shallow(wrapper(
      <BasicMessage
        message={displayMessage}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    ))
    expect(result).toMatchSnapshot()
  })
})
