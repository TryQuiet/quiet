import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { IconCopy } from './IconCopy'

describe('IconCopy', () => {
  it('renders component', () => {
    const result = renderComponent(<IconCopy />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            <div
              class="makeStyles-squareTop-3"
            >
              <div
                class="makeStyles-gradient-4"
              >
                <div
                  class="makeStyles-squareFill-5"
                />
              </div>
            </div>
            <div
              class="makeStyles-squareBottom-6"
            >
              <div
                class="makeStyles-gradient-4"
              >
                <div
                  class="makeStyles-squareFill-5"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
