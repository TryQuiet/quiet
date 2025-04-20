import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { SpinnerLoader } from './SpinnerLoader'

describe('SpinnerLoader', () => {
  it('renders component', () => {
    const result = renderComponent(<SpinnerLoader message='Test loading message' className='test-class-name' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column test-class-name css-ejbsmj-MuiGrid-root"
            data-testid="spinnerLoader"
          >
            <span
              class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorInherit SpinnerLoaderspinner css-62e83j-MuiCircularProgress-root"
              role="progressbar"
              style="width: 40px; height: 40px;"
            >
              <svg
                class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                viewBox="22 22 44 44"
              >
                <circle
                  class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-176wh8e-MuiCircularProgress-circle"
                  cx="44"
                  cy="44"
                  fill="none"
                  r="20.2"
                  stroke-width="3.6"
                />
              </svg>
            </span>
            <span
              class="MuiTypography-root MuiTypography-caption MuiTypography-alignCenter SpinnerLoadermessage css-1ws1t6m-MuiTypography-root"
              style="font-size: 0.9090909090909091rem;"
            >
              Test loading message
            </span>
          </div>
        </div>
      </body>
    `)
  })
})
