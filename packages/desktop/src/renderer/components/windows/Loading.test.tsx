import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'

import { Loading } from './Loading'

describe('Loading', () => {
  it('renders component', () => {
    const result = renderComponent(<Loading message='test Msg' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Loadingroot css-1po2vjj-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item css-1h16bbz-MuiGrid-root"
            >
              <img
                class="Loadingicon"
                src="test-file-stub"
              />
            </div>
            <div
              class="MuiGrid-root MuiGrid-item LoadingprogressBarContainer css-13i4rnv-MuiGrid-root"
            >
              <span
                class="MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-indeterminate LoadingprogressBar css-11iigj6-MuiLinearProgress-root"
                role="progressbar"
              >
                <span
                  class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar1Indeterminate css-1yjyqie-MuiLinearProgress-bar1"
                />
                <span
                  class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar2Indeterminate css-1lju9te-MuiLinearProgress-bar2"
                />
              </span>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item LoadingmessageContainer css-13i4rnv-MuiGrid-root"
            >
              <span
                class="MuiTypography-root MuiTypography-caption Loadingmessage css-1d4bzk2-MuiTypography-root"
              >
                test Msg
              </span>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
