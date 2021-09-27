import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { ChannelInputAction } from './ChannelInputAction'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../../theme'

describe('ChannelInputAction', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <ChannelInputAction classes={mockClasses} onPostOffer={jest.fn()} onSendMoney={jest.fn()} />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})
