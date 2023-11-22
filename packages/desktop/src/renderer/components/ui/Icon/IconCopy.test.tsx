import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { IconCopy } from './IconCopy'

describe('IconCopy', () => {
    it('renders component', () => {
        const result = renderComponent(<IconCopy />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-1hcemt5"
          >
            <div
              class="IconCopysquareTop"
            >
              <div
                class="IconCopygradient"
              >
                <div
                  class="IconCopysquareFill"
                />
              </div>
            </div>
            <div
              class="IconCopysquareBottom"
            >
              <div
                class="IconCopygradient"
              >
                <div
                  class="IconCopysquareFill"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
    })
})
