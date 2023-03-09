import '@testing-library/jest-dom'

import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'

import { InviteComponent } from './InviteComponent'

describe('InviteToCommunity', () => {
  it('renders with hidden invite code', () => {
    const result = renderComponent(
      <InviteComponent
        communityName={'My new community'}
        invitationUrl={'http://registrarurl.onion'}
        handleClickInputReveal={jest.fn()}
        revealInputValue={false}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1ebzqpc-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item InviteToCommunitytitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item InviteToCommunitytitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                >
                  Invite a friend
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <h5
                  class="MuiTypography-root MuiTypography-h5 css-11l3dv4-MuiTypography-root"
                >
                  Your invitation code
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                >
                  To add members to 
                  <span
                    class="InviteToCommunitybold"
                  >
                    My new community
                  </span>
                  , send them this invite code via a secure channel, e.g. Signal. You must be online the first time they join.
                </p>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item InviteToCommunitylinkContainer css-13i4rnv-MuiGrid-root"
            >
              <p
                class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                data-testid="invitation-code"
              >
                •••••••••••••••••••••••••
              </p>
              <button
                class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall InviteToCommunityeyeIcon css-1pe4mpk-MuiButtonBase-root-MuiIconButton-root"
                tabindex="0"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-colorPrimary MuiSvgIcon-fontSizeSmall css-1qc8nxe-MuiSvgIcon-root"
                  data-testid="VisibilityOffIcon"
                  focusable="false"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                  />
                </svg>
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
            <div
              class="MuiGrid-root css-vj1n65-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium InviteToCommunitybutton css-1skytee-MuiButtonBase-root-MuiButton-root"
                tabindex="0"
                type="button"
              >
                Copy to clipboard
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

  it('renders with revealed invite code', () => {
    const result = renderComponent(
      <InviteComponent
        communityName={'My new community'}
        invitationUrl={'http://registrarurl.onion'}
        handleClickInputReveal={jest.fn()}
        revealInputValue={true}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1ebzqpc-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item InviteToCommunitytitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item InviteToCommunitytitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                >
                  Invite a friend
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <h5
                  class="MuiTypography-root MuiTypography-h5 css-11l3dv4-MuiTypography-root"
                >
                  Your invitation code
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                >
                  To add members to 
                  <span
                    class="InviteToCommunitybold"
                  >
                    My new community
                  </span>
                  , send them this invite code via a secure channel, e.g. Signal. You must be online the first time they join.
                </p>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item InviteToCommunitylinkContainer css-13i4rnv-MuiGrid-root"
            >
              <p
                class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                data-testid="invitation-code"
              >
                http://registrarurl.onion
              </p>
              <button
                class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall InviteToCommunityeyeIcon css-1pe4mpk-MuiButtonBase-root-MuiIconButton-root"
                tabindex="0"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-colorPrimary MuiSvgIcon-fontSizeSmall css-1qc8nxe-MuiSvgIcon-root"
                  data-testid="VisibilityIcon"
                  focusable="false"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  />
                </svg>
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
            <div
              class="MuiGrid-root css-vj1n65-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium InviteToCommunitybutton css-1skytee-MuiButtonBase-root-MuiButton-root"
                tabindex="0"
                type="button"
              >
                Copy to clipboard
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
