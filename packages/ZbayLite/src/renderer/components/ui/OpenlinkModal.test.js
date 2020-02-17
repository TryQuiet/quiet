/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { OpenlinkModal } from './OpenlinkModal'
import { mockClasses } from '../../../shared/testing/mocks'

describe('OpenlinkModal', () => {
  it('renders component', () => {
    const result = shallow(
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
    )
    expect(result).toMatchSnapshot()
  })
})
