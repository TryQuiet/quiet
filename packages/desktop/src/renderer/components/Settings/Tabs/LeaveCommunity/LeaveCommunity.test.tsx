import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'

import LeaveCommunityComponent from './LeaveCommunityComponent'

describe('LeaveCommunity', () => {
  it('renders component', () => {
    const result = renderComponent(
      <LeaveCommunityComponent
        communityName={'Rockets'}
        leaveCommunity={jest.fn()}
        open={true}
        handleClose={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container css-1asgg07-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 LeaveCommunitytitleContainer css-s2k0j8-MuiGrid-root"
            >
              <h3
                class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
              >
                Leave community?
              </h3>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 LeaveCommunitydescContainer css-s2k0j8-MuiGrid-root"
            >
              <p
                class="MuiTypography-root MuiTypography-body2 MuiTypography-alignCenter css-13v6k8r-MuiTypography-root"
              >
                You will no longer have access to this community. This can't be undone.
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 LeaveCommunitysecondaryButtonContainer css-s2k0j8-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall LeaveCommunitybutton css-127th3r-MuiButtonBase-root-MuiButton-root"
                tabindex="0"
                type="button"
              >
                Go back
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-auto LeaveCommunitybuttonContainer css-1wrgmsj-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth LeaveCommunitysecondaryButton css-sdx6r0-MuiButtonBase-root-MuiButton-root"
                data-testid="leave-community-button"
                tabindex="0"
                type="button"
              >
                Leave community
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
