import { getReduxStoreFactory, Store } from '@quiet/state-manager'
import { UserProfile } from '@quiet/types'
import '@testing-library/jest-dom'
import { FactoryGirl } from 'factory-girl'
import { prepareStore } from '../../../../testUtils'
import React from 'react'
import MockedSocket from 'socket.io-mock'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { CommunityMembershipComponent } from './CommunityMembership.component'

describe('CommunityMembership', () => {
  let store: Store
  let socket: MockedSocket
  let factory: FactoryGirl
  beforeAll(async () => {
    socket = new MockedSocket()
    const preparedStore = await prepareStore(
      {},
      socket // Fork State manager's sagas
    )
    store = preparedStore.store
    factory = await getReduxStoreFactory(store)
  })

  it('renderComponent - empty user list', () => {
    const result = renderComponent(
      <CommunityMembershipComponent
        userProfiles={{}}
        me={undefined}
        connectedPeers={[]}
        openUserProfilePanel={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1sg20tk-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershiptitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item CommunityMembershiptitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                  data-testid="community-membership-title"
                >
                  Community membership
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipcomponentContainer css-1f064cs-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-1v82g0-MuiGrid-root"
                data-testid="community-membership-search"
              >
                <div
                  class="UserSearchFuzzywrapper css-kcqj7g"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item UserSearchFuzzyroot css-btzz3s-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-78h0li-MuiGrid-root"
                    >
                      <div
                        class="MuiInputBase-root MuiInputBase-colorPrimary css-mv49uc-MuiInputBase-root"
                      >
                        <input
                          class="MuiInputBase-input css-156xqnd-MuiInputBase-input"
                          placeholder="Search for users in your community"
                          type="text"
                          value=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item css-10gxzgy-MuiGrid-root"
              >
                <ul
                  class="MuiList-root css-1mk9mw3-MuiList-root"
                  data-testid="community-membership-list"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renderComponent - user list with one user, me tag, and connected badge', async () => {
    const me: UserProfile = await factory.create<UserProfile>('UserProfile')
    const result = renderComponent(
      <CommunityMembershipComponent
        userProfiles={{ [me.userId]: me }}
        me={me}
        connectedPeers={[me.userData!.peerId]}
        openUserProfilePanel={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1sg20tk-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershiptitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item CommunityMembershiptitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                  data-testid="community-membership-title"
                >
                  Community membership
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipcomponentContainer css-1f064cs-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-1v82g0-MuiGrid-root"
                data-testid="community-membership-search"
              >
                <div
                  class="UserSearchFuzzywrapper css-kcqj7g"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item UserSearchFuzzyroot css-btzz3s-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-78h0li-MuiGrid-root"
                    >
                      <div
                        class="MuiInputBase-root MuiInputBase-colorPrimary css-mv49uc-MuiInputBase-root"
                      >
                        <input
                          class="MuiInputBase-input css-156xqnd-MuiInputBase-input"
                          placeholder="Search for users in your community"
                          type="text"
                          value=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item css-10gxzgy-MuiGrid-root"
              >
                <ul
                  class="MuiList-root css-1mk9mw3-MuiList-root"
                  data-testid="community-membership-list"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item css-1f064cs-MuiGrid-root"
                    >
                      <div
                        class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root CommunityMemberListItemroot css-18ndpo7-MuiButtonBase-root-MuiListItemButton-root"
                        data-testid="user_1-membership-list-item"
                        role="button"
                        tabindex="-1"
                      >
                        <span
                          class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
                        >
                          <span
                            class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarMedium"
                            style="border-radius: 4px;"
                          >
                            <div
                              style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                            >
                              <img
                                alt="user_1"
                                src="dGVzdAo="
                                style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                              />
                            </div>
                          </span>
                          <span
                            class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
                            data-testid="user_1-profile-photo-status-badge"
                          />
                        </span>
                        <div
                          class="MuiListItemText-root CommunityMemberListItemitemText CommunityMemberListItemprimary css-tlelie-MuiListItemText-root"
                        >
                          <span
                            class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-m1llqv-MuiTypography-root"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-item css-1nyrs1g-MuiGrid-root"
                            >
                              <h4
                                class="MuiTypography-root MuiTypography-h4 CommunityMemberListItemnickname css-ajdqea-MuiTypography-root"
                                data-testid="user_1-membership-list-name"
                              >
                                user_1
                              </h4>
                              <h4
                                class="MuiTypography-root MuiTypography-h4 MuiTypography-alignLeft CommunityMemberListItemnickname CommunityMemberListItemme css-1d19vqw-MuiTypography-root"
                                data-testid="membership-list-me"
                              >
                                me
                              </h4>
                            </div>
                          </span>
                        </div>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipdivider css-1f064cs-MuiGrid-root"
                    >
                      <li />
                    </div>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renderComponent - user list with one user, no me tag, and no connected badge', async () => {
    const me: UserProfile = await factory.create<UserProfile>('UserProfile')
    const result = renderComponent(
      <CommunityMembershipComponent
        userProfiles={{ [me.userId]: me }}
        me={undefined}
        connectedPeers={[]}
        openUserProfilePanel={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1sg20tk-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershiptitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item CommunityMembershiptitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                  data-testid="community-membership-title"
                >
                  Community membership
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipcomponentContainer css-1f064cs-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-1v82g0-MuiGrid-root"
                data-testid="community-membership-search"
              >
                <div
                  class="UserSearchFuzzywrapper css-kcqj7g"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item UserSearchFuzzyroot css-btzz3s-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-78h0li-MuiGrid-root"
                    >
                      <div
                        class="MuiInputBase-root MuiInputBase-colorPrimary css-mv49uc-MuiInputBase-root"
                      >
                        <input
                          class="MuiInputBase-input css-156xqnd-MuiInputBase-input"
                          placeholder="Search for users in your community"
                          type="text"
                          value=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item css-10gxzgy-MuiGrid-root"
              >
                <ul
                  class="MuiList-root css-1mk9mw3-MuiList-root"
                  data-testid="community-membership-list"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item css-1f064cs-MuiGrid-root"
                    >
                      <div
                        class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root CommunityMemberListItemroot css-18ndpo7-MuiButtonBase-root-MuiListItemButton-root"
                        data-testid="user_2-membership-list-item"
                        role="button"
                        tabindex="-1"
                      >
                        <span
                          class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
                        >
                          <span
                            class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarMedium"
                            style="border-radius: 4px;"
                          >
                            <div
                              style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                            >
                              <img
                                alt="user_2"
                                src="dGVzdAo="
                                style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                              />
                            </div>
                          </span>
                          <span
                            class="MuiBadge-badge MuiBadge-dot MuiBadge-invisible MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge MuiBadge-invisible css-10f6i39-MuiBadge-badge"
                            data-testid="user_2-profile-photo-status-badge"
                          />
                        </span>
                        <div
                          class="MuiListItemText-root CommunityMemberListItemitemText CommunityMemberListItemprimary css-tlelie-MuiListItemText-root"
                        >
                          <span
                            class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-m1llqv-MuiTypography-root"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-item css-1nyrs1g-MuiGrid-root"
                            >
                              <h4
                                class="MuiTypography-root MuiTypography-h4 CommunityMemberListItemnickname css-ajdqea-MuiTypography-root"
                                data-testid="user_2-membership-list-name"
                              >
                                user_2
                              </h4>
                            </div>
                          </span>
                        </div>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipdivider css-1f064cs-MuiGrid-root"
                    >
                      <li />
                    </div>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renderComponent - user list with multiple users', async () => {
    const me: UserProfile = await factory.create<UserProfile>('UserProfile')
    const user1: UserProfile = await factory.create<UserProfile>('UserProfile')
    const user2: UserProfile = await factory.create<UserProfile>('UserProfile')
    const result = renderComponent(
      <CommunityMembershipComponent
        userProfiles={{ [me.userId]: me, [user1.userId]: user1, [user2.userId]: user2 }}
        me={me}
        connectedPeers={[me.userData!.peerId]}
        openUserProfilePanel={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1sg20tk-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershiptitleDiv css-89gxc5-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item CommunityMembershiptitle css-13i4rnv-MuiGrid-root"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                  data-testid="community-membership-title"
                >
                  Community membership
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipcomponentContainer css-1f064cs-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-1v82g0-MuiGrid-root"
                data-testid="community-membership-search"
              >
                <div
                  class="UserSearchFuzzywrapper css-kcqj7g"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item UserSearchFuzzyroot css-btzz3s-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-78h0li-MuiGrid-root"
                    >
                      <div
                        class="MuiInputBase-root MuiInputBase-colorPrimary css-mv49uc-MuiInputBase-root"
                      >
                        <input
                          class="MuiInputBase-input css-156xqnd-MuiInputBase-input"
                          placeholder="Search for users in your community"
                          type="text"
                          value=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item css-10gxzgy-MuiGrid-root"
              >
                <ul
                  class="MuiList-root css-1mk9mw3-MuiList-root"
                  data-testid="community-membership-list"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item css-1f064cs-MuiGrid-root"
                    >
                      <div
                        class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root CommunityMemberListItemroot css-18ndpo7-MuiButtonBase-root-MuiListItemButton-root"
                        data-testid="user_3-membership-list-item"
                        role="button"
                        tabindex="-1"
                      >
                        <span
                          class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
                        >
                          <span
                            class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarMedium"
                            style="border-radius: 4px;"
                          >
                            <div
                              style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                            >
                              <img
                                alt="user_3"
                                src="dGVzdAo="
                                style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                              />
                            </div>
                          </span>
                          <span
                            class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
                            data-testid="user_3-profile-photo-status-badge"
                          />
                        </span>
                        <div
                          class="MuiListItemText-root CommunityMemberListItemitemText CommunityMemberListItemprimary css-tlelie-MuiListItemText-root"
                        >
                          <span
                            class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-m1llqv-MuiTypography-root"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-item css-1nyrs1g-MuiGrid-root"
                            >
                              <h4
                                class="MuiTypography-root MuiTypography-h4 CommunityMemberListItemnickname css-ajdqea-MuiTypography-root"
                                data-testid="user_3-membership-list-name"
                              >
                                user_3
                              </h4>
                              <h4
                                class="MuiTypography-root MuiTypography-h4 MuiTypography-alignLeft CommunityMemberListItemnickname CommunityMemberListItemme css-1d19vqw-MuiTypography-root"
                                data-testid="membership-list-me"
                              >
                                me
                              </h4>
                            </div>
                          </span>
                        </div>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipdivider css-1f064cs-MuiGrid-root"
                    >
                      <li />
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item css-1f064cs-MuiGrid-root"
                    >
                      <div
                        class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root CommunityMemberListItemroot css-18ndpo7-MuiButtonBase-root-MuiListItemButton-root"
                        data-testid="user_4-membership-list-item"
                        role="button"
                        tabindex="-1"
                      >
                        <span
                          class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
                        >
                          <span
                            class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarMedium"
                            style="border-radius: 4px;"
                          >
                            <div
                              style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                            >
                              <img
                                alt="user_4"
                                src="dGVzdAo="
                                style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                              />
                            </div>
                          </span>
                          <span
                            class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
                            data-testid="user_4-profile-photo-status-badge"
                          />
                        </span>
                        <div
                          class="MuiListItemText-root CommunityMemberListItemitemText CommunityMemberListItemprimary css-tlelie-MuiListItemText-root"
                        >
                          <span
                            class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-m1llqv-MuiTypography-root"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-item css-1nyrs1g-MuiGrid-root"
                            >
                              <h4
                                class="MuiTypography-root MuiTypography-h4 CommunityMemberListItemnickname css-ajdqea-MuiTypography-root"
                                data-testid="user_4-membership-list-name"
                              >
                                user_4
                              </h4>
                            </div>
                          </span>
                        </div>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipdivider css-1f064cs-MuiGrid-root"
                    >
                      <li />
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item css-1f064cs-MuiGrid-root"
                    >
                      <div
                        class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-root CommunityMemberListItemroot css-18ndpo7-MuiButtonBase-root-MuiListItemButton-root"
                        data-testid="user_5-membership-list-item"
                        role="button"
                        tabindex="-1"
                      >
                        <span
                          class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
                        >
                          <span
                            class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarMedium"
                            style="border-radius: 4px;"
                          >
                            <div
                              style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                            >
                              <img
                                alt="user_5"
                                src="dGVzdAo="
                                style="width: 28px; height: 28px; size: 28px; border-radius: 4px;"
                              />
                            </div>
                          </span>
                          <span
                            class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
                            data-testid="user_5-profile-photo-status-badge"
                          />
                        </span>
                        <div
                          class="MuiListItemText-root CommunityMemberListItemitemText CommunityMemberListItemprimary css-tlelie-MuiListItemText-root"
                        >
                          <span
                            class="MuiTypography-root MuiTypography-body1 MuiListItemText-primary css-m1llqv-MuiTypography-root"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-item css-1nyrs1g-MuiGrid-root"
                            >
                              <h4
                                class="MuiTypography-root MuiTypography-h4 CommunityMemberListItemnickname css-ajdqea-MuiTypography-root"
                                data-testid="user_5-membership-list-name"
                              >
                                user_5
                              </h4>
                            </div>
                          </span>
                        </div>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item CommunityMembershipdivider css-1f064cs-MuiGrid-root"
                    >
                      <li />
                    </div>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
