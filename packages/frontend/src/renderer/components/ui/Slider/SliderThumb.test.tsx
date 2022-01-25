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
            class="makeStyles-root-1"
          />
        </div>
      </body>
    `)
  })
})
