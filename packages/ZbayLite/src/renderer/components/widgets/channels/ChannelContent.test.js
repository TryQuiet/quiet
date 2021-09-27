import React from 'react'
import { shallow } from 'enzyme'
import { ChannelContent } from './ChannelContent'
import { mockClasses } from '../../../../shared/testing/mocks'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelContent', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelContent
          channelType={CHANNEL_TYPE.NORMAL}
          classes={mockClasses}
          measureRef={jest.fn()}
          contentRect={{}}
          inputLocked
          mentions={{}}
          sendInvitation={jest.fn()}
          removeMention={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})
