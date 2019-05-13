import React from 'react'
import { shallow } from 'enzyme'

import { CreateChannelForm } from './CreateChannelForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('CreateChannelForm', () => {
  it('renders component', () => {
    const result = shallow(
      <CreateChannelForm
        classes={mockClasses}
        onSubmit={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
