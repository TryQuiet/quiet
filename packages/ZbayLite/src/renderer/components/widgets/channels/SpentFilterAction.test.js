import React from 'react'
import { shallow } from 'enzyme'

import { SpentFilterAction } from './SpentFilterAction'
import { mockClasses } from '../../../../shared/testing/mocks'
import { MuiThemeProvider } from '@material-ui/core/styles'

import theme from '../../../theme'

describe('SpentFilter', () => {
  const wrapper = el => <MuiThemeProvider theme={theme}>{el}</MuiThemeProvider>

  it('renders component', () => {
    const result = shallow(wrapper(<SpentFilterAction classes={mockClasses} />))
    expect(result).toMatchSnapshot()
  })
})
