import React from 'react'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../shared/setupTests'
import { prepareStore, testReducers } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'
import { getReduxStoreFactory, publicChannels, communities, identity, users } from '@quiet/state-manager'
import ChannelsPanel from './ChannelsPanel'
import DirectMessagesPanel from '../DirectMessagesPanel/DirectMessagesPanel'
import { DateTime } from 'luxon'
import { generateChannelId } from '@quiet/common'
import { Identity, UserProfile } from '@quiet/types'
import { createLogger } from '../../../logger'

const logger = createLogger('ChannelsPanelTest')

describe('Channels panel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('displays channels and users in proper order', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork State manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    const community = await factory.create('Community')
    const generalChannel = publicChannels.selectors.generalChannel(store.getState())
    expect(generalChannel).not.toBeUndefined()
    const alice: Identity = await factory.create('Identity', {
      communityId: community.id,
    })
    const aliceUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: alice.userId,
      name: 'Alice',
    })
    logger.info('Alice user profile created:', JSON.stringify(aliceUserProfile, null, 2))
    const aliceUser = await factory.create('User', {
      userId: alice.userId,
    })

    // Create additional users for the users list
    const bob: Identity = await factory.create('Identity', {
      communityId: community.id,
    })
    const bobUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: bob.userId,
      name: 'Bob',
    })
    const bobUser = await factory.create('User', {
      userId: bob.userId,
    })

    const charlie: Identity = await factory.create('Identity', {
      communityId: community.id,
    })
    const charlieUserProfile: UserProfile = await factory.create('UserProfile', {
      userId: charlie.userId,
      name: 'Charlie',
    })
    const charlieUser = await factory.create('User', {
      userId: charlie.userId,
    })

    // Setup channels
    const channelNames = ['croatia', 'allergies', 'sailing', 'pets', 'antiques']

    for (const name of channelNames) {
      const isPublic = name === 'pets' ? false : true
      await factory.create('PublicChannel', {
        channel: {
          name: name,
          description: `Welcome to #${name}`,
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateChannelId(name),
          public: isPublic,
        },
      })
    }

    const channels = publicChannels.selectors.publicChannels(store.getState())
    const userProfilesMap = users.selectors.userProfiles(store.getState())

    if (!generalChannel) throw new Error('generalChannel is undefined')

    // Mock userProfileContextMenu
    const mockUserProfileContextMenu = {
      visible: false,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
      setUserId: jest.fn(),
      setPosition: jest.fn(),
      closeMenu: jest.fn(),
      userId: '',
      users: {},
      position: { x: 0, y: 0 },
    }

    const result = renderComponent(
      <>
        <ChannelsPanel
          channels={channels}
          userProfiles={userProfilesMap}
          connectedPeers={[aliceUserProfile.userData!.peerId, bobUserProfile.userData!.peerId]}
          unreadChannels={[]}
          setCurrentChannel={function (_id: string): void {}}
          currentChannelId={generalChannel.id}
          createChannelModal={{
            open: false,
            handleOpen: function (_args?: any): any {},
            handleClose: function (): any {},
          }}
          isTorInitialized={true}
          canCreateChannel={true}
        />
        <DirectMessagesPanel
          myUserProfile={aliceUserProfile}
          userProfiles={userProfilesMap}
          connectedPeers={[aliceUserProfile.userData!.peerId, bobUserProfile.userData!.peerId]}
          isTorInitialized={true}
          setCurrentChannel={jest.fn()}
          openNewMessageWindow={jest.fn()}
          currentChannelId={generalChannel.id}
          unreadDms={[]}
          dmChannels={[]}
        />
      </>
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
                        class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeLarge SidebarHeadericonButton css-kg6xtt-MuiButtonBase-root-MuiIconButton-root"
                        data-testid="sidebar-button-createChannel"
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
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot ChannelsListItemselected css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                            class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                          >
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                              data-testid="general-channel-link-icon-public"
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
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="general-channel-link-text"
                            >
                              general
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
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                            class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                          >
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                              data-testid="croatia-channel-link-icon-public"
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
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="croatia-channel-link-text"
                            >
                              croatia
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
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                            class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                          >
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                              data-testid="allergies-channel-link-icon-public"
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
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="allergies-channel-link-text"
                            >
                              allergies
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
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                            class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                          >
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                              data-testid="sailing-channel-link-icon-public"
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
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="sailing-channel-link-text"
                            >
                              sailing
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
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                            class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                          >
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                              data-testid="pets-channel-link-icon-private"
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
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="pets-channel-link-text"
                            >
                              pets
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
                    class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                            class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                          >
                            <svg
                              aria-hidden="true"
                              class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                              data-testid="antiques-channel-link-icon-public"
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
                            <p
                              class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                              data-testid="antiques-channel-link-text"
                            >
                              antiques
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
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true css-1fzha0v-MuiGrid-root"
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
                    Direct messages
                  </p>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <span>
                    <button
                      class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeLarge SidebarHeadericonButton css-kg6xtt-MuiButtonBase-root-MuiIconButton-root"
                      data-testid="sidebar-button-createNewMessage"
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
              <ul
                class="MuiList-root css-1mk9mw3-MuiList-root"
                data-testid="dm-list"
              />
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
                      class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeLarge SidebarHeadericonButton css-kg6xtt-MuiButtonBase-root-MuiIconButton-root"
                      data-testid="sidebar-button-createChannel"
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot ChannelsListItemselected css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                          class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                        >
                          <svg
                            aria-hidden="true"
                            class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                            data-testid="general-channel-link-icon-public"
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
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="general-channel-link-text"
                          >
                            general
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                          class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                        >
                          <svg
                            aria-hidden="true"
                            class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                            data-testid="croatia-channel-link-icon-public"
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
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="croatia-channel-link-text"
                          >
                            croatia
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                          class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                        >
                          <svg
                            aria-hidden="true"
                            class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                            data-testid="allergies-channel-link-icon-public"
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
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="allergies-channel-link-text"
                          >
                            allergies
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                          class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                        >
                          <svg
                            aria-hidden="true"
                            class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                            data-testid="sailing-channel-link-icon-public"
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
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="sailing-channel-link-text"
                          >
                            sailing
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                          class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                        >
                          <svg
                            aria-hidden="true"
                            class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                            data-testid="pets-channel-link-icon-private"
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
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="pets-channel-link-text"
                          >
                            pets
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root ChannelsListItemroot css-4vt7bz-MuiButtonBase-root-MuiListItemButton-root"
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
                          class="MuiGrid-root MuiGrid-container css-rwxjqg-MuiGrid-root"
                        >
                          <svg
                            aria-hidden="true"
                            class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ChannelsListItemlock css-i4bv87-MuiSvgIcon-root"
                            data-testid="antiques-channel-link-icon-public"
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
                          <p
                            class="MuiTypography-root MuiTypography-body2 ChannelsListItemtitle css-16d47hw-MuiTypography-root"
                            data-testid="antiques-channel-link-text"
                          >
                            antiques
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
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true css-1fzha0v-MuiGrid-root"
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
                  Direct messages
                </p>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <span>
                  <button
                    class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeLarge SidebarHeadericonButton css-kg6xtt-MuiButtonBase-root-MuiIconButton-root"
                    data-testid="sidebar-button-createNewMessage"
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
            <ul
              class="MuiList-root css-1mk9mw3-MuiList-root"
              data-testid="dm-list"
            />
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
