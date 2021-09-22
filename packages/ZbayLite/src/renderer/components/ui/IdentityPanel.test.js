/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { initialState } from '../../store/handlers/identity'
import { IdentityPanel } from './IdentityPanel'

import { MuiThemeProvider } from '@material-ui/core'
import theme from '../../theme'

describe('IdentityPanel', () => {
  it('renders component with username', () => {
    const identity = {
      ...initialState.data,
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
      name: 'Saturn'
    }
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <IdentityPanel
          classes={mockClasses}
          identity={identity}
          handleSettings={jest.fn()}
          user={{ nickname: 'test' }}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
  it('renders component without username', () => {
    const identity = {
      ...initialState.data,
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
      name: 'Saturn'
    }
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <IdentityPanel
          classes={mockClasses}
          identity={identity}
          handleSettings={jest.fn()}
          user={{ nickname: 'test' }}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})
