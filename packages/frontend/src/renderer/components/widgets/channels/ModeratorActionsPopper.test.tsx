import React from 'react'

import { ModeratorActionsPopper } from './ModeratorActionsPopper'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('ModeratorActionsPopper', () => {
  it('renders', () => {
    const ref = React.createRef<HTMLAnchorElement>()
    const result = renderComponent(
      <ModeratorActionsPopper
        name='123'
        address='123'
        open
        anchorEl={ref.current}
        banUser={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
        <div
          role="tooltip"
          style="position: fixed; top: 0px; left: 0px;"
        >
          <div
            class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-info-5 MuiGrid-container MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <img
                  class="makeStyles-user-3"
                  src="test-file-stub"
                />
              </div>
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"
                >
                  <h5
                    class="MuiTypography-root makeStyles-username-2 MuiTypography-h5"
                  >
                    123
                  </h5>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"
                >
                  <span
                    class="MuiTypography-root makeStyles-address-4 MuiTypography-caption"
                  >
                    123
                  </span>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-actions-7 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root makeStyles-banDiv-10 MuiGrid-container MuiGrid-item"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <img
                    class="makeStyles-banIcon-9"
                    src="test-file-stub"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <p
                    class="MuiTypography-root makeStyles-action-6 MuiTypography-body1"
                  >
                    Silence user
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
