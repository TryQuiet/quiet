/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { SettingsModal } from './SettingsModal'
import { mockClasses } from '../../../../../shared/testing/mocks'

describe('SettingsModal', () => {
  it('renders component', () => {
    const result = shallow(
      <SettingsModal
        open
        classes={mockClasses}
        handleClose={jest.fn()}
        modalTabToOpen={'account'}
        clearCurrentOpenTab={jest.fn()}
        currentTab={'addFunds'}
        setCurrentTab={jest.fn()}
        blockedUsers={{}}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
