/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Security } from './Security'

describe('Security', () => {
  it('renders component', () => {
    const result = renderComponent(
      <Security
        openSeedModal={jest.fn()}
        allowAll={true}
        toggleAllowAll={jest.fn()}
        isRescanned={true}
        onRescan={jest.fn()}
        whitelisted={[]}
        removeSiteHost={jest.fn()}
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
                  Security
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <h5
                  class="MuiTypography-root MuiTypography-h5"
                >
                  Your private recovery key
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2"
                >
                  If something happens to your computer, you’ll need this key to recover your account and your funds.
                </p>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <button
                  class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-7 MuiButton-containedPrimary MuiButton-containedSizeLarge MuiButton-sizeLarge MuiButton-fullWidth"
                  tabindex="0"
                  type="submit"
                >
                  <span
                    class="MuiButton-label"
                  >
                    View key
                  </span>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </button>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h5
                class="MuiTypography-root MuiTypography-h5"
              >
                P2P messaging over Tor
              </h5>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <p
                class="MuiTypography-root MuiTypography-body2"
              >
                For faster message delivery, Zbay can send and receive messages directly with Tor (instead of the Zcash blockchain) when other users are online.
                 
                <a
                  class="makeStyles-link-9"
                  href="https://www.zbay.app/faq.html"
                >
                  Learn more.
                </a>
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h5
                class="MuiTypography-root MuiTypography-h5"
              >
                Verification
              </h5>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <p
                class="MuiTypography-root MuiTypography-body2"
              >
                Zbay has been re-synced.
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h5
                class="MuiTypography-root MuiTypography-h5"
              >
                Outbound Links
              </h5>
            </div>
            <div
              class="MuiGrid-root makeStyles-labelDiv-4 MuiGrid-item"
            >
              <label
                class="MuiFormControlLabel-root"
              >
                <span
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-189 MuiCheckbox-root PrivateSwitchBase-checked-190 Mui-checked"
                >
                  <span
                    class="MuiIconButton-label"
                  >
                    <input
                      checked=""
                      class="PrivateSwitchBase-input-192"
                      data-indeterminate="false"
                      type="checkbox"
                      value=""
                    />
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root"
                      focusable="false"
                      role="presentation"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                  </span>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </span>
                <span
                  class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                >
                  <p
                    class="MuiTypography-root makeStyles-alignLabel-3 MuiTypography-body2"
                  >
                    Never warn me about outbound link on Zbay.
                  </p>
                </span>
              </label>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
