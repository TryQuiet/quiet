import '@testing-library/jest-dom'
import React from 'react'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { InviteComponent } from './Invite.component'

describe('CopyLink', () => {
  it('renderComponent- long link', () => {
    const result = renderComponent(
      <InviteComponent
        invitationLink={
          'https://tryquiet.org/join?code=http://p7lrosb6fvtt7t3fhmuh5uj5twxirpngeipemdm5d32shgz46cbd3bad.onion'
        }
        openUrl={() => console.log('url')}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-73vx0f-MuiGrid-root"
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
                  Your community link
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                >
                  Anyone with Quiet app can follow this link to join this community.
                  <br />
                   Only share with people you trust.
                </p>
                <a>
                  <p
                    class="MuiTypography-root MuiTypography-body2 InviteToCommunitylink css-16d47hw-MuiTypography-root"
                  >
                    https://tryquiet.org/join?code=http://p7lrosb6fvtt7t3fhmuh5uj5twxir...
                  </p>
                </a>
              </div>
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

  it('renderComponent - short link', () => {
    const result = renderComponent(
      <InviteComponent
        invitationLink={'https://tryquiet.org/'}
        openUrl={() => console.log('url')}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-73vx0f-MuiGrid-root"
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
                  Your community link
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                >
                  Anyone with Quiet app can follow this link to join this community.
                  <br />
                   Only share with people you trust.
                </p>
                <a>
                  <p
                    class="MuiTypography-root MuiTypography-body2 InviteToCommunitylink css-16d47hw-MuiTypography-root"
                  >
                    https://tryquiet.org/
                  </p>
                </a>
              </div>
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
