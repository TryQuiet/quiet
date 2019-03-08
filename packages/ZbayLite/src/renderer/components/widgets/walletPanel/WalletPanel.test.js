/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../../shared/testing/mocks'
import { WalletPanel } from './WalletPanel'

describe('WalletPanelActions', () => {
  it('renders component', () => {
    const result = shallow(
      <WalletPanel classes={mockClasses} />
    )
    expect(result).toMatchSnapshot()
  })
})
