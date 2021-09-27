/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { OpenlinkModal } from './OpenlinkModal'
import { mockClasses } from '../../../../shared/testing/mocks'

import { MuiThemeProvider } from '@material-ui/core/styles'
import { theme } from '../../../theme'

describe('OpenlinkModal', () => {
  it('renders component', () => {
    const result = shallow(
      <MuiThemeProvider theme={theme}>
        <OpenlinkModal
          classes={mockClasses}
          url='https://www.zbay.app/'
          open
          isImage
          handleClose={jest.fn()}
          handleConfirm={jest.fn()}
          addToWhitelist={jest.fn()}
          setWhitelistAll={jest.fn()}
        />
      </MuiThemeProvider>
    )
    expect(result).toMatchSnapshot()
  })
})
