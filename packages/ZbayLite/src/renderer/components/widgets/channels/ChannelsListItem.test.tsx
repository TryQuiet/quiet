import React from 'react'
import { shallow } from 'enzyme'
import theme from '../../../theme'

import { ChannelsListItem } from './ChannelsListItem'

import { MuiThemeProvider } from '@material-ui/core'
import { Contact } from '../../../store/handlers/contacts'

describe('ChannelsListItem', () => {
  it('renders component public channel', () => {
    const channel = new Contact()
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelsListItem
          channel={channel}
          selected={{}}
          directMessages={false}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component direct messages channel', () => {
    const channel = new Contact()
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelsListItem
          channel={channel}
          selected={{}}
          directMessages={true}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})
