import React from 'react'

import each from 'jest-each'

import { Elipsis } from './Elipsis'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('Elipsis', () => {
    each(['bottom-start', 'bottom', 'bottom-end']).test('renders with placement %s', placement => {
        const result = renderComponent(
            <Elipsis content={'this is a sample text'} length={5} tooltipPlacement={placement} />
        )
        expect(result.baseElement).toMatchSnapshot()
    })

    it('renders with custom size', () => {
        const result = renderComponent(<Elipsis content={'this is a sample text'} length={5} />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <span
              class="MuiTypography-root MuiTypography-caption Elipsiscontent css-1d4bzk2-MuiTypography-root"
              data-mui-internal-clone-element="true"
            >
              this ...
            </span>
          </span>
        </div>
      </body>
    `)
    })

    it('disables if shorter than limit', () => {
        const result = renderComponent(<Elipsis content={'this is a sample text'} length={50} />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <span
              class="MuiTypography-root MuiTypography-caption Elipsiscontent css-1d4bzk2-MuiTypography-root"
              data-mui-internal-clone-element="true"
            >
              this is a sample text
            </span>
          </span>
        </div>
      </body>
    `)
    })
})
