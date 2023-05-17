import React from 'react'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../shared/setupTests'
import { prepareStore } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'
import { getFactory, publicChannels, communities, identity } from '@quiet/state-manager'
import ChannelsPanel from './ChannelsPanel'
import { DateTime } from 'luxon'
import { generateChannelAddress } from '@quiet/common'

describe('Channels panel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('displays channels in proper order', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork State manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')
    const generalChannel = publicChannels.selectors.generalChannel(store.getState())
    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    // Setup channels
    const channelNames = ['croatia', 'allergies', 'sailing', 'pets', 'antiques']

    for (const name of channelNames) {
      await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: name,
            description: `Welcome to #${name}`,
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: generateChannelAddress(name)
          }
        }
      )
    }

    const channels = publicChannels.selectors.publicChannels(store.getState())

    const result = renderComponent(
      <ChannelsPanel
        channels={channels}
        unreadChannels={[]}
        setCurrentChannel={function (_address: string): void {}}
        currentChannelAddress={generalChannel.address}
        createChannelModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {}
        }}
      />
    )

    expect(result).toMatchInlineSnapshot(`
      Object {
        "asFragment": [Function],
        "baseElement": <body>
          <div>
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
                  data-testid="channelsList"
                >
                  <div
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot ChannelsListItemselected css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                    data-testid="general-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="general-link-text"
                            >
                              # general
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                    data-testid="allergies-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="allergies-link-text"
                            >
                              # allergies
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                    data-testid="antiques-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="antiques-link-text"
                            >
                              # antiques
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                    data-testid="croatia-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="croatia-link-text"
                            >
                              # croatia
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                    data-testid="pets-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="pets-link-text"
                            >
                              # pets
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                    data-testid="sailing-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="sailing-link-text"
                            >
                              # sailing
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </body>,
        "container": <div>
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
                data-testid="channelsList"
              >
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot ChannelsListItemselected css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="general-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                  >
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="general-link-text"
                          >
                            # general
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="allergies-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                  >
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="allergies-link-text"
                          >
                            # allergies
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="antiques-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                  >
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="antiques-link-text"
                          >
                            # antiques
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="croatia-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                  >
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="croatia-link-text"
                          >
                            # croatia
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="pets-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                  >
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="pets-link-text"
                          >
                            # pets
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-1u7u4xu-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="sailing-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root ChannelsListItemitemText css-tlelie-MuiListItemText-root"
                  >
                    <span
                      class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary ChannelsListItemprimary css-m1llqv-MuiTypography-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container css-1vam7s3-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="sailing-link-text"
                          >
                            # sailing
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </div>
              </ul>
            </div>
          </div>
        </div>,
        "debug": [Function],
        "findAllByAltText": [Function],
        "findAllByDisplayValue": [Function],
        "findAllByLabelText": [Function],
        "findAllByPlaceholderText": [Function],
        "findAllByRole": [Function],
        "findAllByTestId": [Function],
        "findAllByText": [Function],
        "findAllByTitle": [Function],
        "findByAltText": [Function],
        "findByDisplayValue": [Function],
        "findByLabelText": [Function],
        "findByPlaceholderText": [Function],
        "findByRole": [Function],
        "findByTestId": [Function],
        "findByText": [Function],
        "findByTitle": [Function],
        "getAllByAltText": [Function],
        "getAllByDisplayValue": [Function],
        "getAllByLabelText": [Function],
        "getAllByPlaceholderText": [Function],
        "getAllByRole": [Function],
        "getAllByTestId": [Function],
        "getAllByText": [Function],
        "getAllByTitle": [Function],
        "getByAltText": [Function],
        "getByDisplayValue": [Function],
        "getByLabelText": [Function],
        "getByPlaceholderText": [Function],
        "getByRole": [Function],
        "getByTestId": [Function],
        "getByText": [Function],
        "getByTitle": [Function],
        "queryAllByAltText": [Function],
        "queryAllByDisplayValue": [Function],
        "queryAllByLabelText": [Function],
        "queryAllByPlaceholderText": [Function],
        "queryAllByRole": [Function],
        "queryAllByTestId": [Function],
        "queryAllByText": [Function],
        "queryAllByTitle": [Function],
        "queryByAltText": [Function],
        "queryByDisplayValue": [Function],
        "queryByLabelText": [Function],
        "queryByPlaceholderText": [Function],
        "queryByRole": [Function],
        "queryByTestId": [Function],
        "queryByText": [Function],
        "queryByTitle": [Function],
        "rerender": [Function],
        "unmount": [Function],
      }
    `)
  })
})
