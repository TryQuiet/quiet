import React from 'react'
import { shallow } from 'enzyme'

import { SendMessagePopover } from './SendMessagePopover'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMessagePopover', () => {
  it('renders popover', () => {
    const result = shallow(
      <SendMessagePopover
        classes={mockClasses}
        anchorEl
        handleClose={jest.fn()}
        username='TestUser'
        address={'ztestsapling1juf4322spfp2nhmqaz5wymw8nkkxxyv06x38cel2nj6d7s8fdyd6dlsmc6efv02sf0kty2v7lfz'}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
