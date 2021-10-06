import React from 'react'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { BasicMessage } from './BasicMessage'
import { now, createMessage } from '../../../testUtils'
import { MuiThemeProvider } from '@material-ui/core/styles'

import theme from '../../../theme'

describe('BasicMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  const wrapper = el => <MuiThemeProvider theme={theme}>{el}</MuiThemeProvider>

  it('renders component', async () => {
    const message = await createMessage()
    const result = shallow(wrapper(
      <BasicMessage
        message={message}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    ))
    expect(result).toMatchSnapshot()
  })

  it('renders component when message is sent by owner', async () => {
    const message = await createMessage()
    const result = shallow(wrapper(
      <BasicMessage
        message={message}
        actionsOpen={false}
        setActionsOpen={jest.fn()}
        allowModeration
      />
    ))
    expect(result).toMatchSnapshot()
  })
})
