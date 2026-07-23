import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/dom'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../../../../shared/setupTests'
import { prepareStore } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'

import CreateChannel from './CreateChannel'
import CreateChannelComponent from './CreateChannelComponent'

import { ModalName } from '../../../sagas/modals/modals.types'
import { modalsActions } from '../../../sagas/modals/modals.slice'

import { getReduxStoreFactory, publicChannels } from '@quiet/state-manager'

import { createLogger } from '../../../logger'
import { act } from '@testing-library/react'
import { ErrorMessages, Identity } from '@quiet/types'

const logger = createLogger('createChannel:test')

describe('Add new channel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    // @ts-ignore
    socket.emitWithAck = async (...input: [string, ...any]) => {}
  })

  it('entered channel name is slugified', async () => {
    const user = userEvent.setup()
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork State-manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    await factory.create('Identity', {
      nickname: 'alice',
    })
    await factory.create('ChannelPermissions')

    renderComponent(<CreateChannel />, store)

    await act(async () => {
      store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))
    })

    const input = await screen.findByPlaceholderText('Enter a channel name')
    await user.type(input, 'Some channel NAME  ')

    // FIXME: await user.click(screen.getByText('Create Channel') causes this and few other tests to fail (hangs on taking createChannel action)
    await act(
      async () =>
        await waitFor(() => {
          user.click(screen.getByText('Create Channel')).catch(e => {
            logger.error(e)
          })
        })
    )
    // Modal should close after user submits channel name
    expect(screen.queryByDisplayValue('Create a new public channel')).toBeNull()

    await act(async () => {
      await runSaga(testSubmittedChannelName).toPromise()
    })

    function* testSubmittedChannelName(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      expect(createChannelAction.payload.name).toEqual('some-channel-name--')
    }
  })

  it('user provides proper name', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork State-manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    await factory.create('ChannelPermissions')

    renderComponent(
      <CreateChannelComponent
        open={true}
        createChannel={() => {}}
        handleClose={() => {}}
        clearErrorsDispatch={() => {}}
        canCreateChannel={true}
        canCreatePrivateChannel={true}
      />
    )

    const input = screen.getByPlaceholderText('Enter a channel name')
    const warning = screen.queryByTestId('createChannelNameWarning')

    await userEvent.type(input, 'happy-path')
    expect(warning).toBeNull()
  })

  it(`user doesn't have permissions to create channel`, async () => {
    const result = renderComponent(
      <CreateChannelComponent
        open={true}
        createChannel={() => {}}
        handleClose={() => {}}
        clearErrorsDispatch={() => {}}
        canCreateChannel={false}
        canCreatePrivateChannel={false}
      />
    )

    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style=""
      >
        <div />
      </body>
    `)
  })

  it(`user doesn't have permissions to create private channel`, async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork State-manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    await factory.create('ChannelPermissions', {
      genericPermissions: {
        public: {
          create: true,
          delete: true,
        },
        private: {
          create: false,
        },
      },
    })

    const result = renderComponent(
      <CreateChannelComponent
        open={true}
        createChannel={() => {}}
        handleClose={() => {}}
        clearErrorsDispatch={() => {}}
        canCreateChannel={true}
        canCreatePrivateChannel={false}
      />
    )

    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="MuiModal-root css-1l68gny-MuiModal-root"
          data-testid="createChannelModal"
          role="presentation"
        >
          <div
            aria-hidden="true"
            class="MuiBackdrop-root css-i9fmh8-MuiBackdrop-root-MuiModal-backdrop"
            style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
          />
          <div
            data-testid="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Modalcentered css-6gh8l0-MuiGrid-root"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader css-lx31tv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                >
                  <h6
                    class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle css-jxzupi-MuiTypography-root"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="ModalActions"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-1hpikoh-MuiButtonBase-root-MuiIconButton-root"
                      data-testid="ModalClose"
                      tabindex="0"
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                        data-testid="ClearIcon"
                        focusable="false"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-7mjq5i-MuiGrid-root"
                >
                  <form>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column CreateChannelComponentfullContainer css-1e5jxqd-MuiGrid-root"
                    >
                      <h3
                        class="MuiTypography-root MuiTypography-h3 CreateChannelComponenttitle css-ptjqt4-MuiTypography-root"
                      >
                        Create a new channel
                      </h3>
                      <p
                        class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                      >
                        Channel name
                      </p>
                      <div
                        class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-wb57ya-MuiFormControl-root-MuiTextField-root"
                        data-testid="createChannelInput"
                      >
                        <div
                          class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth Mui-focused MuiInputBase-formControl css-1hwo1uj-MuiInputBase-root-MuiOutlinedInput-root"
                        >
                          <input
                            aria-invalid="false"
                            class="MuiInputBase-input MuiOutlinedInput-input css-nrutr0-MuiInputBase-input-MuiOutlinedInput-input"
                            id=":r2:"
                            name="channelName"
                            placeholder="Enter a channel name"
                            type="text"
                            value=""
                          />
                          <fieldset
                            aria-hidden="true"
                            class="MuiOutlinedInput-notchedOutline css-9425fu-MuiOutlinedInput-notchedOutline"
                          >
                            <legend
                              class="css-ihdtdm"
                            >
                              <span
                                class="notranslate"
                              >
                                ​
                              </span>
                            </legend>
                          </fieldset>
                        </div>
                      </div>
                      <p
                        class="MuiTypography-root MuiTypography-body2 css-6gbt2m-MuiTypography-root"
                      />
                      <div
                        class="CreateChannelComponentgutter"
                      />
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium CreateChannelComponentbutton css-ak90sa-MuiButtonBase-root-MuiButton-root"
                        data-testid="channelNameSubmit"
                        tabindex="0"
                        type="submit"
                      >
                        Create Channel
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div
            data-testid="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)
  })

  it('Displays error if trying to add channel with already taken name', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    const alice = await factory.create<Identity>('Identity')
    await factory.create('ChannelPermissions')

    renderComponent(<CreateChannel />, store)

    await act(async () => {
      store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))
    })

    const input = await screen.findByPlaceholderText('Enter a channel name')
    const user = userEvent.setup()
    await user.type(input, 'general')

    const button = screen.getByText('Create Channel')
    await user.click(button)

    const error = await screen.findByText(ErrorMessages.CHANNEL_NAME_TAKEN)
    expect(error).toBeVisible()
  })

  it.each([
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
    ['!@#$%^&*()', '----------'],
  ])('user inserting wrong channel name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
    const { store } = await prepareStore(
      {},
      socket // Fork State-manager's sagas
    )

    const factory = await getReduxStoreFactory(store)
    await factory.create('ChannelPermissions')

    renderComponent(
      <CreateChannelComponent
        open={true}
        createChannel={() => {}}
        handleClose={() => {}}
        clearErrorsDispatch={() => {}}
        canCreateChannel={true}
        canCreatePrivateChannel={true}
      />
    )

    const input = screen.getByPlaceholderText('Enter a channel name')

    await userEvent.type(input, name)
    expect(screen.getByTestId('createChannelNameWarning')).toHaveTextContent(
      `Your channel will be created as #${corrected}`
    )
  })
})
