/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { LogsComponent } from './Logs'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('LogsComponent', () => {
  it('renders component', () => {
    const result = shallow(
      <LogsComponent
        open
        classes={mockClasses}
        debugLogs={[]}
        closeLogsWindow={jest.fn()}
        applicationLogs={[]}
        transactionsLogs={[]}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
