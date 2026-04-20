import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelHeaderComponent } from './ChannelHeader'

describe('ChannelHeader', () => {
  describe('Public', () => {
    it('hides context menu', () => {
      const result = renderComponent(
        <ChannelHeaderComponent channelName='general' isPublic={true} enableContextMenu={false} />
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <div
              class="ChannelHeaderComponentwrapper css-1ii203w"
            >
              <div
                class="MuiGrid-root MuiGrid-container ChannelHeaderComponentroot css-9cyib4-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-lx31tv-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1w3ck99-MuiGrid-root"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelHeaderComponenttitle ChannelHeaderComponentbold ChannelHeaderComponentlock css-i4bv87-MuiSvgIcon-root"
                          data-testid="channelTitle-icon-public"
                          fill="currentColor"
                          focusable="false"
                          style="font-size: 16px; line-height: 26px; font-family: 'Rubik', sans-serif,Menlo Regular; font-weight: 400;"
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
                        <h6
                          class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-noWrap ChannelHeaderComponenttitle ChannelHeaderComponentbold css-b4jm9l-MuiTypography-root"
                          data-testid="channelTitle"
                          style="max-width: 724px;"
                        >
                          general
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true ChannelHeaderComponentactions css-s0ysqh-MuiGrid-root"
                />
              </div>
            </div>
          </div>
        </body>
      `)
    })
    it('reveals context menu', () => {
      const result = renderComponent(
        <ChannelHeaderComponent channelName='general' isPublic={true} enableContextMenu={true} />
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <div
              class="ChannelHeaderComponentwrapper css-1ii203w"
            >
              <div
                class="MuiGrid-root MuiGrid-container ChannelHeaderComponentroot css-9cyib4-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-lx31tv-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1w3ck99-MuiGrid-root"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelHeaderComponenttitle ChannelHeaderComponentbold ChannelHeaderComponentlock css-i4bv87-MuiSvgIcon-root"
                          data-testid="channelTitle-icon-public"
                          fill="currentColor"
                          focusable="false"
                          style="font-size: 16px; line-height: 26px; font-family: 'Rubik', sans-serif,Menlo Regular; font-weight: 400;"
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
                        <h6
                          class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-noWrap ChannelHeaderComponenttitle ChannelHeaderComponentbold css-b4jm9l-MuiTypography-root"
                          data-testid="channelTitle"
                          style="max-width: 724px;"
                        >
                          general
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true ChannelHeaderComponentactions css-s0ysqh-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item ChannelHeaderComponentmenu css-13i4rnv-MuiGrid-root"
                    data-testid="channelContextMenuButton"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="MoreHorizIcon"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      `)
    })
  })
  describe('Private', () => {
    it('hides context menu', () => {
      const result = renderComponent(
        <ChannelHeaderComponent channelName='general' isPublic={false} enableContextMenu={false} />
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <div
              class="ChannelHeaderComponentwrapper css-1ii203w"
            >
              <div
                class="MuiGrid-root MuiGrid-container ChannelHeaderComponentroot css-9cyib4-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-lx31tv-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1w3ck99-MuiGrid-root"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelHeaderComponenttitle ChannelHeaderComponentbold ChannelHeaderComponentlock css-i4bv87-MuiSvgIcon-root"
                          data-testid="channelTitle-icon-private"
                          fill="currentColor"
                          focusable="false"
                          style="font-size: 16px; line-height: 26px; font-family: 'Rubik', sans-serif,Menlo Regular; font-weight: 400;"
                          viewBox="0 0 24 24"
                        >
                          <svg
                            fill="currentColor"
                            height="24"
                            viewBox="0 0 24 24"
                            width="24"
                          >
                            <mask
                              fill="#fff"
                              id="a"
                            >
                              <path
                                d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                              />
                            </mask>
                            <path
                              d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                              mask="url(#a)"
                              stroke="currentColor"
                              stroke-width="4"
                            />
                            <path
                              clip-rule="evenodd"
                              d="M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z"
                              fill="currentColor"
                              fill-rule="evenodd"
                              stroke-width="4"
                            />
                          </svg>
                        </svg>
                        <h6
                          class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-noWrap ChannelHeaderComponenttitle ChannelHeaderComponentbold css-b4jm9l-MuiTypography-root"
                          data-testid="channelTitle"
                          style="max-width: 724px;"
                        >
                          general
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true ChannelHeaderComponentactions css-s0ysqh-MuiGrid-root"
                />
              </div>
            </div>
          </div>
        </body>
      `)
    })
    it('reveals context menu', () => {
      const result = renderComponent(
        <ChannelHeaderComponent channelName='general' isPublic={false} enableContextMenu={true} />
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <div
              class="ChannelHeaderComponentwrapper css-1ii203w"
            >
              <div
                class="MuiGrid-root MuiGrid-container ChannelHeaderComponentroot css-9cyib4-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-lx31tv-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1w3ck99-MuiGrid-root"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelHeaderComponenttitle ChannelHeaderComponentbold ChannelHeaderComponentlock css-i4bv87-MuiSvgIcon-root"
                          data-testid="channelTitle-icon-private"
                          fill="currentColor"
                          focusable="false"
                          style="font-size: 16px; line-height: 26px; font-family: 'Rubik', sans-serif,Menlo Regular; font-weight: 400;"
                          viewBox="0 0 24 24"
                        >
                          <svg
                            fill="currentColor"
                            height="24"
                            viewBox="0 0 24 24"
                            width="24"
                          >
                            <mask
                              fill="#fff"
                              id="a"
                            >
                              <path
                                d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                              />
                            </mask>
                            <path
                              d="M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
                              mask="url(#a)"
                              stroke="currentColor"
                              stroke-width="4"
                            />
                            <path
                              clip-rule="evenodd"
                              d="M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z"
                              fill="currentColor"
                              fill-rule="evenodd"
                              stroke-width="4"
                            />
                          </svg>
                        </svg>
                        <h6
                          class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-noWrap ChannelHeaderComponenttitle ChannelHeaderComponentbold css-b4jm9l-MuiTypography-root"
                          data-testid="channelTitle"
                          style="max-width: 724px;"
                        >
                          general
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true ChannelHeaderComponentactions css-s0ysqh-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item ChannelHeaderComponentmenu css-13i4rnv-MuiGrid-root"
                    data-testid="channelContextMenuButton"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="MoreHorizIcon"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      `)
    })
  })
})
