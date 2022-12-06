/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../store'
import { Main } from './Main'

describe('Main', () => {
  it('renders component', () => {
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <Main />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            <div
              class="WindowWrapperwrapper css-j4mowy"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-1l1q2w3-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column SidebarComponentroot css-di2ta-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true SidebarComponentpadding css-1fzha0v-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                      >
                        <div
                          class="css-1c9y83e"
                        >
                          <span
                            class="MuiButtonBase-root MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium css-1skytee-MuiButtonBase-root-MuiButton-root"
                            data-testid="settings-panel-button"
                            role="button"
                            tabindex="0"
                          >
                            <h4
                              class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-ajdqea-MuiTypography-root"
                            />
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-ptiqhd-MuiSvgIcon-root"
                              data-testid="ExpandMoreIcon"
                              focusable="false"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"
                              />
                            </svg>
                            <span
                              class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                            />
                          </span>
                        </div>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true css-1fzha0v-MuiGrid-root"
                      >
                        <div
                          style="overflow: visible; height: 0px; width: 0px;"
                        >
                          <div
                            class="rc-scrollbars-container"
                            style="position: relative; overflow: hidden; width: 0px; height: 0px;"
                          >
                            <div
                              class="rc-scrollbars-view"
                              style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
                            >
                              <div
                                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true css-1fzha0v-MuiGrid-root"
                              >
                                <div
                                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                >
                                  <div
                                    class="MuiGrid-root MuiGrid-container SidebarHeaderroot css-1tia2hp-MuiGrid-root"
                                  >
                                    <div
                                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                    >
                                      <p
                                        class="MuiTypography-root MuiTypography-body2 SidebarHeadertitle css-16d47hw-MuiTypography-root"
                                      >
                                        Channels
                                      </p>
                                    </div>
                                    <div
                                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                    >
                                      <span>
                                        <button
                                          class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeLarge SidebarHeadericonButton css-1pux6rn-MuiButtonBase-root-MuiIconButton-root"
                                          data-mui-internal-clone-element="true"
                                          data-testid="addChannelButton"
                                          tabindex="0"
                                          type="button"
                                        >
                                          <svg
                                            fill="none"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            width="18"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M22.0499 12C22.0499 17.5505 17.5504 22.05 12 22.05C6.44949 22.05 1.94995 17.5505 1.94995 12C1.94995 6.44955 6.44949 1.95001 12 1.95001C17.5504 1.95001 22.0499 6.44955 22.0499 12Z"
                                              stroke="white"
                                              stroke-width="1.5"
                                            />
                                            <path
                                              clip-rule="evenodd"
                                              d="M17.3415 12.5982H12.5983V17.3415H11.4018V12.5982H6.65857V11.4018H11.4018V6.65851H12.5983V11.4018H17.3415V12.5982Z"
                                              fill="white"
                                              fill-rule="evenodd"
                                            />
                                          </svg>
                                          <span
                                            class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                          />
                                        </button>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                >
                                  <ul
                                    class="MuiList-root css-1mk9mw3-MuiList-root"
                                  />
                                </div>
                              </div>
                            </div>
                            <div
                              class="rc-scrollbars-track rc-scrollbars-track-h"
                              style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; left: 2px; height: 6px; display: none;"
                            >
                              <div
                                class="rc-scrollbars-thumb rc-scrollbars-thumb-h"
                                style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
                              />
                            </div>
                            <div
                              class="rc-scrollbars-track rc-scrollbars-track-v"
                              style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; top: 2px; width: 6px; display: none;"
                            >
                              <div
                                class="rc-scrollbars-thumb rc-scrollbars-thumb-v"
                                style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          class="resize-triggers"
                        >
                          <div
                            class="expand-trigger"
                          >
                            <div
                              style="width: 1px; height: 1px;"
                            />
                          </div>
                          <div
                            class="contract-trigger"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
