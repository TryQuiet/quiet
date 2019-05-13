import React from 'react'
import { shallow } from 'enzyme'

import { ImportChannelModal } from './ImportChannelModal'

describe('ImportChannelForm', () => {
  it('renders component', () => {
    const result = shallow(
      <ImportChannelModal handleClose={jest.fn()} open />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component closed', () => {
    const result = shallow(
      <ImportChannelModal handleClose={jest.fn()} open={false} />
    )
    expect(result).toMatchSnapshot()
  })
})
