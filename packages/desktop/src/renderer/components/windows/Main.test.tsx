import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Main } from './Main'
import { communities, getReduxStoreFactory } from '@quiet/state-manager'
import { prepareStore, testReducers } from '../../testUtils'

describe('Main', () => {
  it('renders component', async () => {
    const store = (await prepareStore()).store
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community', {
      rootCa: 'rootCa',
    })
    await factory.create('ChannelPermissions')
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
                    class="SidebarComponentroot css-lfb242"
                    data-testid="sidebar"
                  >
                    <div
                      class="SidebarComponentheader"
                    >
                      <div
                        class="SidebarComponentwindowControls"
                      />
                      <div
                        class="IdentityPanelroot css-15v2td"
                      >
                        <button
                          class="IdentityPanelbutton"
                          data-testid="settings-panel-button"
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            class="CommunityIconroot css-1spqh73"
                          >
                            C
                          </span>
                          <span
                            class="IdentityPanelnameGroup"
                          >
                            <h4
                              class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-1inrl58-MuiTypography-root"
                              data-testid="current-community-name"
                            >
                              community_1
                            </h4>
                            <span
                              class="IdentityPanelcaret"
                            >
                              <svg
                                aria-hidden="true"
                                fill="none"
                                focusable="false"
                                height="16"
                                viewBox="0 0 16 16"
                                width="16"
                              >
                                <path
                                  d="M11.5246 7.09375H4.47265C4.2937 7.09375 4.20482 7.31075 4.33234 7.43628L7.84462 10.8937C7.92224 10.9701 8.04674 10.9703 8.12467 10.8942L11.6644 7.43683C11.7927 7.31153 11.704 7.09375 11.5246 7.09375Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                    <div
                      class="SidebarComponentscrollArea"
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
                            style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px; overflow-x: hidden;"
                          >
                            <div
                              class="SidebarComponentcontent"
                            >
                              <ul
                                class="MuiList-root css-1mk9mw3-MuiList-root"
                                data-testid="prominentActionsList"
                              >
                                <div
                                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1k15c8s-MuiButtonBase-root-MuiListItemButton-root"
                                  data-testid="add-members-link"
                                  role="button"
                                  tabindex="0"
                                >
                                  <span
                                    class="SidebarRowglyph"
                                  >
                                    <svg
                                      aria-hidden="true"
                                      fill="none"
                                      focusable="false"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      width="12"
                                    >
                                      <circle
                                        cx="4.5"
                                        cy="4"
                                        r="1.5"
                                        stroke="currentColor"
                                      />
                                      <path
                                        d="M9.5 3.5C9.5 4.67157 9.5 6.5 9.5 6.5"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-width="0.75"
                                      />
                                      <path
                                        d="M11 5C9.82843 5 8 5 8 5"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-width="0.75"
                                      />
                                      <path
                                        d="M7.82375 8.77097C7.2907 7.40505 5.66103 6.86719 4.5 6.86719C3.33611 6.86719 1.70127 7.3863 1.17233 8.77001C0.975132 9.28589 1.44742 9.75 1.99971 9.75H4.5H7.00012C7.5524 9.75 8.02453 9.28547 7.82375 8.77097Z"
                                        stroke="currentColor"
                                      />
                                    </svg>
                                  </span>
                                  <p
                                    class="MuiTypography-root MuiTypography-body2 SidebarRowlabel css-1t82dwi-MuiTypography-root"
                                    data-testid="add-members-link-text"
                                  >
                                    Add members
                                  </p>
                                </div>
                              </ul>
                              <div>
                                <div
                                  class="SidebarHeaderroot css-1f72bw8"
                                >
                                  <h6
                                    class="MuiTypography-root MuiTypography-subtitle2 SidebarHeadertitle css-1oy8xdk-MuiTypography-root"
                                  >
                                    Channels
                                  </h6>
                                  <span>
                                    <button
                                      aria-label="Create new channel"
                                      class="SidebarHeaderaction"
                                      data-mui-internal-clone-element="true"
                                      data-testid="addChannelButton"
                                      type="button"
                                    >
                                      <svg
                                        aria-hidden="true"
                                        fill="none"
                                        focusable="false"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        width="16"
                                      >
                                        <path
                                          d="M8 4V12"
                                          stroke="currentColor"
                                        />
                                        <path
                                          d="M12 8L4 8"
                                          stroke="currentColor"
                                        />
                                        <circle
                                          cx="8"
                                          cy="8"
                                          r="7.5"
                                          stroke="currentColor"
                                        />
                                      </svg>
                                    </button>
                                  </span>
                                </div>
                                <ul
                                  class="MuiList-root css-1mk9mw3-MuiList-root"
                                  data-testid="channelsList"
                                >
                                  <div
                                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot SidebarRowselected css-1k15c8s-MuiButtonBase-root-MuiListItemButton-root"
                                    data-testid="general-link"
                                    role="button"
                                    tabindex="0"
                                  >
                                    <span
                                      class="SidebarRowglyph"
                                    >
                                      <svg
                                        aria-hidden="true"
                                        class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                                        data-testid="general-channel-link-icon-public"
                                        fill="currentColor"
                                        focusable="false"
                                        style="font-size: 14px;"
                                        viewBox="0 0 24 24"
                                      >
                                        <svg
                                          fill="none"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          width="24"
                                        >
                                          <path
                                            d="M15.7318 4.875L12.8818 19.125"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-width="2"
                                          />
                                          <path
                                            d="M10.5355 4.875L7.68555 19.125"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-width="2"
                                          />
                                          <path
                                            d="M6.8252 8.58594H17.7502"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-width="2"
                                          />
                                          <path
                                            d="M5.875 15.4141H16.8"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-width="2"
                                          />
                                        </svg>
                                      </svg>
                                    </span>
                                    <p
                                      class="MuiTypography-root MuiTypography-body2 SidebarRowlabel css-1t82dwi-MuiTypography-root"
                                      data-testid="general-channel-link-text"
                                    >
                                      general
                                    </p>
                                  </div>
                                </ul>
                              </div>
                              <div>
                                <div
                                  class="SidebarHeaderroot css-1f72bw8"
                                >
                                  <h6
                                    class="MuiTypography-root MuiTypography-subtitle2 SidebarHeadertitle css-1oy8xdk-MuiTypography-root"
                                  >
                                    Users
                                  </h6>
                                </div>
                                <ul
                                  class="MuiList-root css-1mk9mw3-MuiList-root"
                                  data-testid="usersList"
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
                    <div
                      class="UserProfilePanel-root css-1baejcn"
                    >
                      <button
                        class="UserProfilePanel-button"
                        data-testid="user-profile-menu-button"
                        type="button"
                      >
                        <span
                          class="UserProfilePanel-profilePhoto"
                        >
                          Jdenticon
                        </span>
                        <p
                          class="MuiTypography-root MuiTypography-body2 UserProfilePanel-nickname css-1t82dwi-MuiTypography-root"
                          data-testid="user-profile-nickname"
                        />
                      </button>
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
