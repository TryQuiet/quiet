import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { SpinnerLoader } from './SpinnerLoader'

describe('SpinnerLoader', () => {
  it('renders component', () => {
    const result = renderComponent(
      <SpinnerLoader message='Test loading message' className='test-class-name' />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root test-class-name MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <div
              class="MuiCircularProgress-root makeStyles-spinner-2 makeStyles-spinner-3 MuiCircularProgress-indeterminate"
              role="progressbar"
              style="width: 40px; height: 40px;"
            >
              <svg
                class="MuiCircularProgress-svg"
                viewBox="22 22 44 44"
              >
                <circle
                  class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate"
                  cx="44"
                  cy="44"
                  fill="none"
                  r="20.2"
                  stroke-width="3.6"
                />
              </svg>
            </div>
            <span
              class="MuiTypography-root makeStyles-message-1 MuiTypography-caption MuiTypography-alignCenter"
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
