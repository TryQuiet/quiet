/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../../shared/testing/mocks'
import { TopUpModal } from './TopUpModal'

describe('TopUpModal', () => {
  it('renders component with transparent option', () => {
    const result = shallow(
      <TopUpModal
        classes={mockClasses}
        open={false}
        type='transparent'
        address='t14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1'
        description='Transparent description'
        handleChange={jest.fn()}
        handleClose={jest.fn()}
        handleCopy={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with private option', () => {
    const result = shallow(
      <TopUpModal
        classes={mockClasses}
        open={false}
        type='private'
        address='zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
        description='Private description'
        handleChange={jest.fn()}
        handleClose={jest.fn()}
        handleCopy={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
