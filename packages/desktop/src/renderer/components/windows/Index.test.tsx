/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'

import { Index } from './Index'

describe('Index', () => {
  it('renders component', () => {
    const result = renderComponent(<Index bootstrapping bootstrappingMessage='Launching node' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="WindowWrapperwrapper Indexroot css-7im36y"
          >
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
                  class="MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-indeterminate LoadingprogressBar css-1sitdca-MuiLinearProgress-root"
                  role="progressbar"
                >
                  <span
                    class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar1Indeterminate css-16ee83t-MuiLinearProgress-bar1"
                  />
                  <span
                    class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar2Indeterminate css-1f9igvw-MuiLinearProgress-bar2"
                  />
                </span>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item LoadingmessageContainer css-13i4rnv-MuiGrid-root"
              >
                <span
                  class="MuiTypography-root MuiTypography-caption Loadingmessage css-1d4bzk2-MuiTypography-root"
                >
                  Launching node
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders when bootstrapping', () => {
    const result = renderComponent(<Index bootstrapping bootstrappingMessage='Launching node' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="WindowWrapperwrapper Indexroot css-7im36y"
          >
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
                  class="MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-indeterminate LoadingprogressBar css-1sitdca-MuiLinearProgress-root"
                  role="progressbar"
                >
                  <span
                    class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar1Indeterminate css-16ee83t-MuiLinearProgress-bar1"
                  />
                  <span
                    class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar2Indeterminate css-1f9igvw-MuiLinearProgress-bar2"
                  />
                </span>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item LoadingmessageContainer css-13i4rnv-MuiGrid-root"
              >
                <span
                  class="MuiTypography-root MuiTypography-caption Loadingmessage css-1d4bzk2-MuiTypography-root"
                >
                  Launching node
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
