/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'

import { MessagesDivider } from './MessagesDivider'

describe('MessagesDivider', () => {
  it('renders component', () => {
    const result = renderComponent(<MessagesDivider title='test' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
            >
              <div
                class="makeStyles-divider-2"
              />
            </div>
            <div
              class="MuiGrid-root makeStyles-titleDiv-3 MuiGrid-item"
            >
              <p
                class="MuiTypography-root MuiTypography-body1"
              >
                test
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
            >
              <div
                class="makeStyles-divider-2"
              />
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
