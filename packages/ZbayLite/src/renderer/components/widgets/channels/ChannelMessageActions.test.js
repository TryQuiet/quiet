import React from 'react'
import * as R from 'ramda'
import { shallow } from 'enzyme'

import { ChannelMessageActions } from './ChannelMessageActions'

describe('ChannelMessageActions', () => {
  each(R.xprod(
    ['cancelled', 'pending', 'success', 'failed', 'broadcasted'],
    [true, false]
  )).test(
    'renders component with status=%s and fromYou=%s',
    (status, fromYou) => {
      const result = shallow(
        <ChannelMessageActions
          status={status}
          fromYou={fromYou}
          onResend={jest.fn()}
          onCancel={jest.fn()}
        />
      )
      expect(result).toMatchSnapshot()
    }
  )
})
