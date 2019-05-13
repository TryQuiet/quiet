import React from 'react'
import { shallow } from 'enzyme'

import { CreateChannelModal } from './CreateChannelModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('CreateChannelModal', () => {
  it('renders component', () => {
    const result = shallow(
      <CreateChannelModal
        handleClose={jest.fn()}
        open
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders closed component', () => {
    const result = shallow(
      <CreateChannelModal
        handleClose={jest.fn()}
        open={false}
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
