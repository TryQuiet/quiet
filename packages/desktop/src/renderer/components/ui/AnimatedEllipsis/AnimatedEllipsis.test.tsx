import React from 'react'

import each from 'jest-each'

import { AnimatedEllipsis } from './AnimatedEllipsis'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('AnimatedEllipsis', () => {
  it('renders text followed by animated ellipsis', () => {
    const result = renderComponent(
      <AnimatedEllipsis content={'Sending'} color={'black'} fontSize={12} fontWeight={'regular'} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-item css-1hr8piw-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-item AnimatedEllipsis-wrapper css-13i4rnv-MuiGrid-root"
            >
              <p
                class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-content css-1w9s1dh-MuiTypography-root"
              >
                Sending
              </p>
              <p
                class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-dot1 css-1w9s1dh-MuiTypography-root"
              >
                .
              </p>
              <p
                class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-dot2 css-1w9s1dh-MuiTypography-root"
              >
                .
              </p>
              <p
                class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-dot3 css-1w9s1dh-MuiTypography-root"
              >
                .
              </p>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
