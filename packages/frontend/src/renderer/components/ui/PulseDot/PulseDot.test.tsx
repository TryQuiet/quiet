import React from 'react'

import each from 'jest-each'

import { PulseDot } from './PulseDot'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('PulseDot', () => {
  each(['healthy', 'syncing', 'restarting', 'down']).test('renders for status %s', status => {
    const result = renderComponent(<PulseDot color={status} />)
    expect(result.baseElement).toMatchSnapshot()
  })

  it('renders with custom size', () => {
    const result = renderComponent(<PulseDot color='healthy' size={32} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-30 makeStyles-healthy-31"
            style="width: 32px; height: 32px;"
          />
        </div>
      </body>
    `)
  })

  it('renders with custom className', () => {
    const result = renderComponent(<PulseDot color='healthy' className='custom-class-name' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-37 makeStyles-healthy-38 custom-class-name"
            style="width: 16px; height: 16px;"
          />
        </div>
      </body>
    `)
  })
})
