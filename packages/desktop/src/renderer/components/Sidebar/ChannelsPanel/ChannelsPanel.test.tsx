import React from 'react'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../shared/setupTests'
import { prepareStore } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'
import { getFactory, publicChannels, communities, identity } from '@quiet/state-manager'
import ChannelsPanel from './ChannelsPanel'
import { DateTime } from 'luxon'

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
            address: name
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
        currentChannel={'general'}
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <div
                  class="MuiGrid-root makeStyles-root-104 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item"
                  >
                    <p
                      class="MuiTypography-root makeStyles-title-105 MuiTypography-body2"
                    >
                      Channels
                    </p>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item"
                  >
                    <span>
                      <button
                        class="MuiButtonBase-root MuiButtonBase-root makeStyles-iconButton-107 MuiIconButton-edgeEnd"
                        data-testid="addChannelButton"
                        tabindex="0"
                        type="button"
                      >
                        <span
                          class="MuiIconButton-label"
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
                        </span>
                        <span
                          class="MuiTouchRipple-root"
                        />
                      </button>
                    </span>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <ul
                  class="MuiList-root"
                >
                  <div
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 makeStyles-selected-171 MuiListItem-button"
                    data-testid="general-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root makeStyles-itemText-177"
                    >
                      <span
                        class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                              data-testid="general-link-text"
                            >
                              # general
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                    data-testid="allergies-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root makeStyles-itemText-177"
                    >
                      <span
                        class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                              data-testid="allergies-link-text"
                            >
                              # allergies
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                    data-testid="antiques-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root makeStyles-itemText-177"
                    >
                      <span
                        class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                              data-testid="antiques-link-text"
                            >
                              # antiques
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                    data-testid="croatia-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root makeStyles-itemText-177"
                    >
                      <span
                        class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                              data-testid="croatia-link-text"
                            >
                              # croatia
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                    data-testid="pets-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root makeStyles-itemText-177"
                    >
                      <span
                        class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                              data-testid="pets-link-text"
                            >
                              # pets
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </div>
                  <div
                    aria-disabled="false"
                    class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                    data-testid="sailing-link"
                    role="button"
                    tabindex="0"
                  >
                    <div
                      class="MuiListItemText-root makeStyles-itemText-177"
                    >
                      <span
                        class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                              data-testid="sailing-link-text"
                            >
                              # sailing
                            </p>
                          </div>
                        </div>
                      </span>
                    </div>
                    <span
                      class="MuiTouchRipple-root"
                    />
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </body>,
        "container": <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-grid-xs-true"
          >
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root makeStyles-root-104 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-title-105 MuiTypography-body2"
                  >
                    Channels
                  </p>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <span>
                    <button
                      class="MuiButtonBase-root MuiButtonBase-root makeStyles-iconButton-107 MuiIconButton-edgeEnd"
                      data-testid="addChannelButton"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiIconButton-label"
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
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                  </span>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <ul
                class="MuiList-root"
              >
                <div
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 makeStyles-selected-171 MuiListItem-button"
                  data-testid="general-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root makeStyles-itemText-177"
                  >
                    <span
                      class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item"
                        >
                          <p
                            class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                            data-testid="general-link-text"
                          >
                            # general
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </div>
                <div
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                  data-testid="allergies-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root makeStyles-itemText-177"
                  >
                    <span
                      class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item"
                        >
                          <p
                            class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                            data-testid="allergies-link-text"
                          >
                            # allergies
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </div>
                <div
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                  data-testid="antiques-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root makeStyles-itemText-177"
                  >
                    <span
                      class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item"
                        >
                          <p
                            class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                            data-testid="antiques-link-text"
                          >
                            # antiques
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </div>
                <div
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                  data-testid="croatia-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root makeStyles-itemText-177"
                  >
                    <span
                      class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item"
                        >
                          <p
                            class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                            data-testid="croatia-link-text"
                          >
                            # croatia
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </div>
                <div
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                  data-testid="pets-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root makeStyles-itemText-177"
                  >
                    <span
                      class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item"
                        >
                          <p
                            class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                            data-testid="pets-link-text"
                          >
                            # pets
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </div>
                <div
                  aria-disabled="false"
                  class="MuiButtonBase-root MuiListItem-root makeStyles-root-170 MuiListItem-button"
                  data-testid="sailing-link"
                  role="button"
                  tabindex="0"
                >
                  <div
                    class="MuiListItemText-root makeStyles-itemText-177"
                  >
                    <span
                      class="MuiTypography-root MuiListItemText-primary makeStyles-primary-172 MuiTypography-body1"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item"
                        >
                          <p
                            class="MuiTypography-root makeStyles-title-173 MuiTypography-body2"
                            data-testid="sailing-link-text"
                          >
                            # sailing
                          </p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <span
                    class="MuiTouchRipple-root"
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
