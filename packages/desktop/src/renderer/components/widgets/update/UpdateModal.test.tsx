/* eslint import/first: 0 */
import React from 'react'

import { UpdateModal } from './UpdateModal'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('UpdateModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <UpdateModal open handleClose={jest.fn()} handleUpdate={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="Modalroot MuiModal-root css-1m4lwbj-MuiModal-root"
          role="presentation"
        >
          <div
            aria-hidden="true"
            class="MuiBackdrop-root css-i9fmh8-MuiBackdrop-root-MuiModal-backdrop"
            style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
          />
          <div
            data-testid="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Modalcentered css-6gh8l0-MuiGrid-root"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader css-lx31tv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                >
                  <h6
                    class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle css-jxzupi-MuiTypography-root"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="ModalActions"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-c8hoqc-MuiButtonBase-root-MuiIconButton-root"
                      tabindex="0"
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                        data-testid="ClearIcon"
                        focusable="false"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-puyhqi-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container UpdateModalinfo css-1lym95h-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-1h16bbz-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item UpdateModaltitle css-13i4rnv-MuiGrid-root"
                    >
                      <h3
                        class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                      >
                        Software update
                      </h3>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-1h16bbz-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item UpdateModalsubTitle css-13i4rnv-MuiGrid-root"
                    >
                      <p
                        class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                      >
                        An update is available for Quiet.
                      </p>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-8 css-m7r6nl-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-4 css-gj1fbr-MuiGrid-root"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge MuiButton-fullWidth UpdateModalbutton css-n0wap0-MuiButtonBase-root-MuiButton-root"
                        tabindex="0"
                        type="submit"
                      >
                        Update now
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            data-testid="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)
  })
})
