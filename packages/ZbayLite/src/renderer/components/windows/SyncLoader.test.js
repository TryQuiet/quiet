import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'
import { SyncLoader } from './SyncLoader'
import { mockClasses } from '../../../shared/testing/mocks'
import { NodeState } from '../../store/handlers/node'

describe('SyncLoader', () => {
  it('renders component', () => {
    const result = shallow(
      <SyncLoader
        classes={mockClasses}
        node={NodeState({ currentBlock: BigNumber(1), latestBlock: BigNumber(100) })}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
