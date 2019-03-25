/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  const TooltipContent = () => <div>TooltipContent</div>

  it('renders component', () => {
    const result = shallow(
      <Tooltip
        classes={mockClasses}
        title='test-title'
      >
        <TooltipContent />
      </Tooltip>
    )
    expect(result).toMatchSnapshot()
  })

  it('renders component with optional props', () => {
    const result = shallow(
      <Tooltip
        classes={mockClasses}
        title='test-title'
        interactive
        noWrap
      >
        <TooltipContent />
      </Tooltip>
    )
    expect(result).toMatchSnapshot()
  })

  each(['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end']).test(
    'renders component with correct arrow placement - %s',
    (placement) => {
      const result = shallow(
        <Tooltip
          classes={mockClasses}
          title='test-title'
          placement={placement}
        >
          <TooltipContent />
        </Tooltip>
      )
      expect(result).toMatchSnapshot()
    }
  )
})
