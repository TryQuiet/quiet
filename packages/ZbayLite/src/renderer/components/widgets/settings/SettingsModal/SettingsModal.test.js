/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SettingsModal } from './SettingsModal'

describe('SettingsModal', () => {
  it('renders component', () => {
    const result = shallow(
      <SettingsModal
        open
        handleClose={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
