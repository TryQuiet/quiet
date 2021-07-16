import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'
import { SyncLoader } from './SyncLoader'
import { mockClasses } from '../../../shared/testing/mocks'

describe('SyncLoader', () => {
  it('renders component', () => {
    const result = shallow(
      <SyncLoader
        classes={mockClasses}
        isGuideCompleted
        currentBlock={BigNumber(1)}
        latestBlock={BigNumber(1000)}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
