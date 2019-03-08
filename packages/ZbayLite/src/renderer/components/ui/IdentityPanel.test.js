/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { IdentityState } from '../../store/handlers/identity'
import { IdentityPanel } from './IdentityPanel'

describe('IdentityPanel', () => {
  it('renders component', () => {
    const identity = IdentityState({
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
      name: 'Saturn'
    })
    const result = shallow(
      <IdentityPanel
        classes={mockClasses}
        identity={identity}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
