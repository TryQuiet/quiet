import React from 'react'
import { shallow } from 'enzyme'
import { ChannelContent } from './ChannelContent'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'
import { Mentions } from '../../../store/handlers/mentions'

describe('ChannelContent', () => {
  it('renders component', () => {
    const mentions = { channelId: [new Mentions()] }
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelContent
          channelType={CHANNEL_TYPE.NORMAL}
          measureRef={jest.fn()}
          contentRect={''}
          mentions={mentions}
          sendInvitation={jest.fn()}
          removeMention={jest.fn()}
          inputState={''}
          contactId={''}
          signerPubKey={''}
          offer={''}
          tab={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})
