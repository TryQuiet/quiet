import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { SliderThumb } from './SliderThumb'

describe('SliderThumb', () => {
    it('renders component', () => {
        const result = renderComponent(<SliderThumb />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="SliderThumbroot css-1o0xzn6"
          />
        </div>
      </body>
    `)
    })
})
