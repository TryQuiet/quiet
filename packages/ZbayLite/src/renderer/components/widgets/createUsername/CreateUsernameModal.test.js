/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { CreateUsernameModal } from './CreateUsernameModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('CreateUsernameModal', () => {
  it('renders component', () => {
    const result = shallow(
      <CreateUsernameModal
        open
        classes={mockClasses}
        checkNickname={jest.fn()}
        handleClose={jest.fn()}
        handleUpdate={jest.fn()}
        handleSubmit={jest.fn()}
        rejectUpdate={jest.fn()}
        usernameFee={0.025}
        zecRate={BigNumber(2)}
        initialValues={{
          nickname: 'test'
        }}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
