import React from 'react'
import { shallow } from 'enzyme'

import { LoadingMessage } from './LoadingMessage'

describe('LoadingMessage', () => {
  /* Skipping test because it can't be verified correctly without wrapping component (MuiThemeProvider),
     which cannot be applied using enzyme library - waiting for @testing-library/react to be introduced */
  it.skip('renders component', () => {
    const result = shallow(<LoadingMessage />)
    expect(result).toMatchSnapshot()
  })
})
