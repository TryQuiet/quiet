/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import each from 'jest-each'
import { Elipsis } from './Elipsis'

describe('Elipsis', () => {
  each(['bottom-start', 'bottom', 'bottom-end']).test(
    'renders with placement %s',
    (placement) => {
      const result = shallow(
        <Elipsis
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
      <Elipsis content={'this is a sample text'} length={5} />
    )
    expect(result).toMatchSnapshot()
  })

  it('disables if shorter than limit', () => {
    const result = shallow(
      <Elipsis content={'this is a sample text'} length={50} />
    )
    expect(result).toMatchSnapshot()
  })
})
