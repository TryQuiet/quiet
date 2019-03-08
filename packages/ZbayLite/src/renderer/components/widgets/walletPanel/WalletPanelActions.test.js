/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { WalletPanelActions } from './WalletPanelActions'

describe('WalletPanelActions', () => {
  it('renders component', () => {
    const result = shallow(
      <WalletPanelActions
        onSend={jest.fn()}
        onReceive={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
