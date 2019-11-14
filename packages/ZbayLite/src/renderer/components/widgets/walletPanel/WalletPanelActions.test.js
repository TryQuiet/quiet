/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { WalletPanelActions } from './WalletPanelActions'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('WalletPanelActions', () => {
  it('renders component', () => {
    const result = shallow(
      <WalletPanelActions
        classes={mockClasses}
        onSend={jest.fn()}
        onReceive={jest.fn()}
        setTabToOpen={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
