/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { BlockchainLocationModal } from './BlockchainLocation'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('BlockchainLocationModal', () => {
  it('renders component', () => {
    const result = shallow(
      <BlockchainLocationModal
        open
        classes={mockClasses}
        handleSelection={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
