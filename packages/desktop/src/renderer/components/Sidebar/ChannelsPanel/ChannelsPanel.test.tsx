import React from 'react'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../shared/setupTests'
import { prepareStore, testReducers } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'
import { getReduxStoreFactory, publicChannels, communities, identity, users } from '@quiet/state-manager'
import ChannelsPanel from './ChannelsPanel'
import DirectMessagesPanel from '../DirectMessagesPanel/DirectMessagesPanel'
import { DateTime } from 'luxon'
import { generateTestChannelId } from '@quiet/common'
import { ChannelType, Identity, PublicChannel, UserProfile } from '@quiet/types'
import { createLogger } from '../../../logger'

const logger = createLogger('ChannelsPanelTest')

describe('Channels panel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('displays the channel list and the direct-messages section in proper order', async () => {
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
          id: generateTestChannelId(name),
          public: isPublic,
        },
      })
    }

    const channels = publicChannels.selectors.publicChannels(store.getState())
    const userProfilesMap = users.selectors.userProfiles(store.getState())

    if (!generalChannel) throw new Error('generalChannel is undefined')

    const result = renderComponent(
      <>
        <ChannelsPanel
          channels={channels}
          unreadChannels={[]}
          setCurrentChannel={function (_id: string): void {}}
          currentChannelId={generalChannel.id}
          createChannelModal={{
            open: false,
            handleOpen: function (_args?: any): any {},
            handleClose: function (): any {},
          }}
          canCreateChannel={true}
        />
        <DirectMessagesPanel
          myUserProfile={aliceUserProfile}
          userProfiles={userProfilesMap}
          isUserConnected={(userId: string | undefined) =>
            userId === aliceUserProfile.userId || userId === bobUserProfile.userId
          }
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
                    data-testid="sidebar-button-createChannel"
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
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot SidebarRowselected css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
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
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="croatia-link"
                  role="button"
                  tabindex="0"
                >
                  <span
                    class="SidebarRowglyph"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="croatia-channel-link-icon-public"
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
                    data-testid="croatia-channel-link-text"
                  >
                    croatia
                  </p>
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="allergies-link"
                  role="button"
                  tabindex="0"
                >
                  <span
                    class="SidebarRowglyph"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="allergies-channel-link-icon-public"
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
                    data-testid="allergies-channel-link-text"
                  >
                    allergies
                  </p>
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="sailing-link"
                  role="button"
                  tabindex="0"
                >
                  <span
                    class="SidebarRowglyph"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="sailing-channel-link-icon-public"
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
                    data-testid="sailing-channel-link-text"
                  >
                    sailing
                  </p>
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="pets-link"
                  role="button"
                  tabindex="0"
                >
                  <span
                    class="SidebarRowglyph"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="pets-channel-link-icon-private"
                      fill="currentColor"
                      focusable="false"
                      style="font-size: 14px;"
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
                  </span>
                  <p
                    class="MuiTypography-root MuiTypography-body2 SidebarRowlabel css-1t82dwi-MuiTypography-root"
                    data-testid="pets-channel-link-text"
                  >
                    pets
                  </p>
                </div>
                <div
                  class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                  data-testid="antiques-link"
                  role="button"
                  tabindex="0"
                >
                  <span
                    class="SidebarRowglyph"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                      data-testid="antiques-channel-link-icon-public"
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
                    data-testid="antiques-channel-link-text"
                  >
                    antiques
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
                  Direct messages
                </h6>
                <span>
                  <button
                    aria-label="Start a new DM"
                    class="SidebarHeaderaction"
                    data-mui-internal-clone-element="true"
                    data-testid="sidebar-button-createNewMessage"
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
                data-testid="dm-list"
              />
            </div>
          </div>
        </body>,
        "container": <div>
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
                  data-testid="sidebar-button-createChannel"
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
                class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot SidebarRowselected css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
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
              <div
                class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                data-testid="croatia-link"
                role="button"
                tabindex="0"
              >
                <span
                  class="SidebarRowglyph"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                    data-testid="croatia-channel-link-icon-public"
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
                  data-testid="croatia-channel-link-text"
                >
                  croatia
                </p>
              </div>
              <div
                class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                data-testid="allergies-link"
                role="button"
                tabindex="0"
              >
                <span
                  class="SidebarRowglyph"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                    data-testid="allergies-channel-link-icon-public"
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
                  data-testid="allergies-channel-link-text"
                >
                  allergies
                </p>
              </div>
              <div
                class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                data-testid="sailing-link"
                role="button"
                tabindex="0"
              >
                <span
                  class="SidebarRowglyph"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                    data-testid="sailing-channel-link-icon-public"
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
                  data-testid="sailing-channel-link-text"
                >
                  sailing
                </p>
              </div>
              <div
                class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                data-testid="pets-link"
                role="button"
                tabindex="0"
              >
                <span
                  class="SidebarRowglyph"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                    data-testid="pets-channel-link-icon-private"
                    fill="currentColor"
                    focusable="false"
                    style="font-size: 14px;"
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
                </span>
                <p
                  class="MuiTypography-root MuiTypography-body2 SidebarRowlabel css-1t82dwi-MuiTypography-root"
                  data-testid="pets-channel-link-text"
                >
                  pets
                </p>
              </div>
              <div
                class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root SidebarRowroot css-1qtf1b2-MuiButtonBase-root-MuiListItemButton-root"
                data-testid="antiques-link"
                role="button"
                tabindex="0"
              >
                <span
                  class="SidebarRowglyph"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                    data-testid="antiques-channel-link-icon-public"
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
                  data-testid="antiques-channel-link-text"
                >
                  antiques
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
                Direct messages
              </h6>
              <span>
                <button
                  aria-label="Start a new DM"
                  class="SidebarHeaderaction"
                  data-mui-internal-clone-element="true"
                  data-testid="sidebar-button-createNewMessage"
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
  /**
   * DM conversations are public channels in the store, so the Channels section has to exclude them
   * by type now that they have a section of their own: without the filter every DM would be listed
   * twice, once under its channel name. A channel created before the type existed carries none, and
   * must still be listed.
   */
  it('keeps direct-message conversations out of the channel list', () => {
    const channel = (name: string, type?: ChannelType): PublicChannel =>
      ({
        name,
        id: generateTestChannelId(name),
        description: `Welcome to #${name}`,
        owner: 'alice',
        timestamp: DateTime.utc().valueOf(),
        public: true,
        type,
      } as unknown as PublicChannel)

    const result = renderComponent(
      <ChannelsPanel
        channels={[channel('untyped'), channel('sailing', ChannelType.CHANNEL), channel('dm_bob', ChannelType.DM)]}
        unreadChannels={[]}
        setCurrentChannel={jest.fn()}
        currentChannelId={generateTestChannelId('untyped')}
        createChannelModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {},
        }}
        canCreateChannel={true}
      />
    )

    expect(result.queryByTestId('untyped-link')).not.toBeNull()
    expect(result.queryByTestId('sailing-link')).not.toBeNull()
    expect(result.queryByTestId('dm_bob-link')).toBeNull()
  })

  it("names the section's (+) after the action it performs", () => {
    const result = renderComponent(
      <ChannelsPanel
        channels={[]}
        unreadChannels={[]}
        setCurrentChannel={jest.fn()}
        currentChannelId={''}
        createChannelModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {},
        }}
        canCreateChannel={true}
      />
    )

    expect(result.queryByTestId('sidebar-button-createChannel')).not.toBeNull()
  })

  it('draws no (+) for a user who may not create a channel', () => {
    const result = renderComponent(
      <ChannelsPanel
        channels={[]}
        unreadChannels={[]}
        setCurrentChannel={jest.fn()}
        currentChannelId={''}
        createChannelModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {},
        }}
        canCreateChannel={false}
      />
    )

    expect(result.queryByTestId('sidebar-button-createChannel')).toBeNull()
  })
})
