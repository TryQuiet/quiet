/* eslint import/first: 0 */
import React from 'react'

import { SettingsModal } from './SettingsModal'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { Provider } from 'react-redux'
import store from '../../../../store'

describe('SettingsModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <Provider store={store}>
        <SettingsModal
          open
          handleClose={jest.fn()}
          modalTabToOpen={'account'}
          clearCurrentOpenTab={jest.fn()}
          currentTab={'addFunds'}
          setCurrentTab={jest.fn()}
          blockedUsers={['string']}
          user='string'
        />
      </Provider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-9"
          role="presentation"
          style="position: fixed; z-index: 1300; right: 0px; bottom: 0px; top: 0px; left: 0px;"
        >
          <div
            aria-hidden="true"
            style="z-index: -1; position: fixed; right: 0px; bottom: 0px; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.5);"
          />
          <div
            data-test="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiGrid-root makeStyles-centered-16 makeStyles-window-17 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-11 makeStyles-headerBorder-12 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-10 makeStyles-bold-18 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  >
                    string
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-13 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-152"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiIconButton-label"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root"
                          focusable="false"
                          role="presentation"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                          />
                        </svg>
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-fullPage-15 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-14 MuiGrid-container MuiGrid-item"
                style="width: 100%;"
              >
                <div
                  class="MuiGrid-root makeStyles-root-1 MuiGrid-container"
                >
                  <div
                    class="MuiGrid-root makeStyles-tabsDiv-5 MuiGrid-item"
                    style="margin-left: 0px;"
                  >
                    <header
                      class="MuiPaper-root MuiPaper-elevation4 MuiAppBar-root MuiAppBar-positionStatic makeStyles-appbar-4 MuiAppBar-colorPrimary"
                    >
                      <div
                        class="MuiTabs-root makeStyles-tabs-2 MuiTabs-vertical"
                      >
                        <div
                          class="MuiTabs-scroller MuiTabs-fixed"
                          style="overflow: hidden;"
                        >
                          <div
                            class="MuiTabs-flexContainer MuiTabs-flexContainerVertical"
                            role="tablist"
                          >
                            <button
                              aria-selected="true"
                              class="MuiButtonBase-root MuiTab-root MuiTab-textColorInherit Mui-selected makeStyles-selected-6"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiTab-wrapper"
                              >
                                Account
                              </span>
                              <span
                                class="MuiTouchRipple-root"
                              />
                            </button>
                            <button
                              aria-selected="false"
                              class="MuiButtonBase-root MuiTab-root MuiTab-textColorInherit"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiTab-wrapper"
                              >
                                Notifications
                              </span>
                              <span
                                class="MuiTouchRipple-root"
                              />
                            </button>
                            <button
                              aria-selected="false"
                              class="MuiButtonBase-root MuiTab-root MuiTab-textColorInherit"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiTab-wrapper"
                              >
                                Security
                              </span>
                              <span
                                class="MuiTouchRipple-root"
                              />
                            </button>
                            <button
                              aria-selected="false"
                              class="MuiButtonBase-root MuiTab-root MuiTab-textColorInherit"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiTab-wrapper"
                              >
                                Blocked Users
                              </span>
                              <span
                                class="MuiTouchRipple-root"
                              />
                            </button>
                          </div>
                          <span
                            class="PrivateTabIndicator-root-234 PrivateTabIndicator-colorSecondary-236 MuiTabs-indicator makeStyles-indicator-3 PrivateTabIndicator-vertical-237"
                            style="top: 0px; height: 0px;"
                          />
                        </div>
                      </div>
                    </header>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
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
                            class="MuiGrid-root makeStyles-content-8 MuiGrid-item"
                            style="padding-right: 0px;"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                            >
                              <div
                                class="MuiGrid-root makeStyles-title-245 MuiGrid-item"
                              >
                                <h3
                                  class="MuiTypography-root MuiTypography-h3"
                                >
                                  Account
                                </h3>
                              </div>
                              <div
                                class="MuiGrid-root MuiGrid-container MuiGrid-justify-xs-center"
                              >
                                <div
                                  class="MuiGrid-root makeStyles-createUsernameContainer-238 MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true"
                                >
                                  <div
                                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"
                                  >
                                    <h4
                                      class="MuiTypography-root MuiTypography-h4"
                                    >
                                      @
                                      
                                    </h4>
                                  </div>
                                </div>
                              </div>
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
          </div>
          <div
            data-test="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)
  })
})
