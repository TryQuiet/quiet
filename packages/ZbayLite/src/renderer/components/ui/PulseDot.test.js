/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PulseDot } from './PulseDot'
import { mockClasses } from '../../../shared/testing/mocks'

describe('PulseDot', () => {
  each(['healthy', 'syncing', 'restarting', 'down']).test(
    'renders for status %s',
    (status) => {
      const result = shallow(
        <PulseDot color={status} classes={mockClasses} />
      )
      expect(result).toMatchSnapshot()
    }
  )

  it('renders with custom size', () => {
    const result = shallow(
      <PulseDot color='healthy' classes={mockClasses} size={32} />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with custom className', () => {
    const result = shallow(
      <PulseDot color='healthy' classes={mockClasses} className='custom-class-name' />
    )
    expect(result).toMatchSnapshot()
  })
})
