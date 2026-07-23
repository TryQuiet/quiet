import { getReduxStoreFactory, Store } from '@quiet/state-manager'
import { PublicChannel, PublicChannelStorage, UserProfile } from '@quiet/types'
import * as fs from 'fs'
import * as path from 'path'
import '@testing-library/jest-dom'
import { FactoryGirl } from 'factory-girl'
import { prepareStore } from '../../testUtils'
import React from 'react'
import MockedSocket from 'socket.io-mock'
import { renderComponent } from '../../testUtils/renderComponent'
import ProfilePhotoWithBadge from './ProfilePhotoWithBadge'
import { DmChannelUserData } from '../Sidebar/DirectMessagesPanel/DirectMessagesPanel'
import { createLogger } from '../../logger'

const logger = createLogger('ProfilePhotoWithBadge:test')

describe('ProfilePhotoWithBadge', () => {
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

  it('renderComponent - default icon all undefineds', () => {
    // this is just to avoid non-deterministic values in the test, if userData is undefined a random uuid will be used to generate the jdenticon
    const fakeUserData = { user: { nickname: 'foo' } } as any
    const result = renderComponent(<ProfilePhotoWithBadge channel={undefined} userData={fakeUserData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-invisible MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge MuiBadge-invisible css-10f6i39-MuiBadge-badge"
              data-testid="foo-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile and no connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: false,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={undefined} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-invisible MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge MuiBadge-invisible css-10f6i39-MuiBadge-badge"
              data-testid="user_1-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile and connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={undefined} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="user_2-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - profile photo icon with connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile')
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={undefined} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              <div
                style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
              >
                <img
                  alt="user_3"
                  src="dGVzdAo="
                  style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
                />
              </div>
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="user_3-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - profile photo icon with no connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile')
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: false,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={undefined} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              <div
                style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
              >
                <img
                  alt="user_4"
                  src="dGVzdAo="
                  style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
                />
              </div>
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-invisible MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge MuiBadge-invisible css-10f6i39-MuiBadge-badge"
              data-testid="user_4-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile, self dm channel (1 user), and connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile, self dm channel (1 user), and connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile, dm channel (1 other user), and connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId, 'foo'],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile, dm group channel (3 other users), and member count badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId, 'foo', 'bar', 'baz'],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-standard MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightRectangular MuiBadge-overlapRectangular MuiBadge-badge css-h8u0cc-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            >
              3
            </span>
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - default icon with valid user profile, dm group channel (10 other users), and max member count badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId, 'foo', 'bar', 'baz', 'bin', 'far', 'faz', 'boo', '123', '456', '789'],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-standard MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightRectangular MuiBadge-overlapRectangular MuiBadge-badge css-h8u0cc-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            >
              9+
            </span>
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - profile photo icon with valid user profile, self dm channel (1 user), and connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile', { photo: undefined })
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              Jdenticon
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - profile photo icon with valid user profile, dm channel (1 other user), and connected badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile')
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId, 'foo'],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              <div
                style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
              >
                <img
                  alt="user_11"
                  src="dGVzdAo="
                  style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
                />
              </div>
            </span>
            <span
              class="MuiBadge-badge MuiBadge-dot MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightCircular MuiBadge-overlapCircular MuiBadge-badge css-mhg7zi-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            />
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - profile photo icon with valid user profile, dm group channel (3 other users), and member count badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile')
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId, 'foo', 'bar', 'baz'],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              <div
                style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
              >
                <img
                  alt="user_12"
                  src="dGVzdAo="
                  style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
                />
              </div>
            </span>
            <span
              class="MuiBadge-badge MuiBadge-standard MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightRectangular MuiBadge-overlapRectangular MuiBadge-badge css-h8u0cc-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            >
              3
            </span>
          </span>
        </div>
      </body>
    `)
  })

  it('renderComponent - profile photo icon with valid user profile, dm group channel (10 other users), and max member count badge', async () => {
    const userProfile = await factory.create<UserProfile>('UserProfile')
    const userData: DmChannelUserData = {
      user: userProfile,
      connected: true,
    }
    const channel: PublicChannelStorage = {
      ...(await factory.create<PublicChannel>('PublicChannel', {
        memberIds: [userProfile.userId, 'foo', 'bar', 'baz', 'bin', 'far', 'faz', 'boo', '123', '456', '789'],
        id: 'channel1',
      })),
      messages: {} as any,
      displayedName: userProfile.nickname,
    }
    const result = renderComponent(<ProfilePhotoWithBadge channel={channel} userData={userData} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiBadge-root MuiBadge-root css-1uwile2-MuiBadge-root"
          >
            <span
              class="ProfilePhotoWithBadgeavatar ProfilePhotoWithBadgeavatarSmall"
              style="border-radius: 4px;"
            >
              <div
                style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
              >
                <img
                  alt="user_13"
                  src="dGVzdAo="
                  style="width: 24px; height: 24px; size: 24px; border-radius: 4px;"
                />
              </div>
            </span>
            <span
              class="MuiBadge-badge MuiBadge-standard MuiBadge-anchorOriginBottomRight MuiBadge-anchorOriginBottomRightRectangular MuiBadge-overlapRectangular MuiBadge-badge css-h8u0cc-MuiBadge-badge"
              data-testid="channel1-profile-photo-status-badge"
            >
              9+
            </span>
          </span>
        </div>
      </body>
    `)
  })
})
