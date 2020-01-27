import React from 'react'
import { shallow } from 'enzyme'

import { ConfirmModal } from './ConfirmModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ConfirmModal', () => {
  it('renders component', () => {
    const result = shallow(
      <ConfirmModal
        classes={mockClasses}
        handleAction={() => {}}
        handleClose={() => {}}
        title='testtitle'
        actionName='testactionname'
        open
      />
    )
    expect(result).toMatchSnapshot()
  })
})
