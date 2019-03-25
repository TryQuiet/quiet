/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { Elipsis } from './Elipsis'
import { mockClasses } from '../../../shared/testing/mocks'

describe('Elipsis', () => {
  each(['bottom-start', 'bottom', 'bottom-end']).test(
    'renders with placement %s',
    (placement) => {
      const result = shallow(
        <Elipsis
          classes={mockClasses}
          content={'this is a sample text'}
          length={5}
          tooltipPlacement={placement}
        />
      )
      expect(result).toMatchSnapshot()
    }
  )

  it('renders with custom size', () => {
    const result = shallow(
      <Elipsis classes={mockClasses} content={'this is a sample text'} length={5} />
    )
    expect(result).toMatchSnapshot()
  })
})
