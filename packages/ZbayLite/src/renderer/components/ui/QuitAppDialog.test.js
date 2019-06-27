/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { QuitAppDialog } from './QuitAppDialog'
import { mockClasses } from '../../../shared/testing/mocks'

describe('QuitAppDialog', () => {
  it('renders component', () => {
    const result = shallow(
      <QuitAppDialog
        open
        classes={mockClasses}
        handleClose={jest.fn()}
        handleQuit={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
