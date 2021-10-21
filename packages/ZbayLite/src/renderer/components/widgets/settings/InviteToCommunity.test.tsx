import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { InviteToCommunity } from '../../../components/widgets/settings/InviteToCommunity'

describe('InviteToCommunity', () => {
  it('renders properly', () => {
    const result = renderComponent(
      <InviteToCommunity
        communityName={'My new community'}
        invitationUrl={'http://registrarurl.onion'}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-titleDiv-2 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3"
                >
                  Invite a friend
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2"
                >
                  Get a link to invite friends to 
                  <span
                    class="makeStyles-bold-11"
                  >
                    My new community
                  </span>
                </p>
              </div>
            </div>
            <div
              class="MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-7 MuiButton-containedPrimary MuiButton-containedSizeLarge MuiButton-sizeLarge MuiButton-fullWidth"
                tabindex="0"
                type="submit"
              >
                <span
                  class="MuiButton-label"
                >
                  Create link
                </span>
                <span
                  class="MuiTouchRipple-root"
                />
              </button>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
