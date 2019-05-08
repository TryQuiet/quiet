import React from 'react'
import { shallow } from 'enzyme'

import { ImportChannelForm } from './ImportChannelForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ImportChannelForm', () => {
  it('renders component', () => {
    const result = shallow(
      <ImportChannelForm
        classes={mockClasses}
        enqueueSnackbar={jest.fn()}
        onDecode={jest.fn()}
        decoding={false}
        decoded={false}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders decoding', () => {
    const result = shallow(
      <ImportChannelForm
        classes={mockClasses}
        enqueueSnackbar={jest.fn()}
        onDecode={jest.fn()}
        decoding
        decoded={false}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders decoded', () => {
    const result = shallow(
      <ImportChannelForm
        classes={mockClasses}
        enqueueSnackbar={jest.fn()}
        onDecode={jest.fn()}
        decoding={false}
        decoded
      />
    )
    expect(result).toMatchSnapshot()
  })
})
