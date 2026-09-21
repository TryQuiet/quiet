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

    // FIXME: await user.click(screen.getByTestId('channelNameSubmit') causes this and few other tests to fail (hangs on taking createChannel action)
    await act(
      async () =>
        await waitFor(() => {
          user.click(screen.getByTestId('channelNameSubmit')).catch(e => {
            logger.error(e)
          })
        })
    )
    // The panel should close after the user submits a channel name
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
          class="MuiDrawer-root MuiDrawer-modal MuiModal-root css-xvvah-MuiModal-root-MuiDrawer-root"
          data-testid="createChannelPanel"
          role="presentation"
        >
          <div
            aria-hidden="true"
            class="MuiBackdrop-root MuiBackdrop-invisible css-g3hgs1-MuiBackdrop-root-MuiModal-backdrop"
            style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
          />
          <div
            data-testid="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiPaper-root MuiPaper-elevation MuiPaper-elevation16 MuiDrawer-paper MuiDrawer-paperAnchorRight css-1jq2bcn-MuiPaper-root-MuiDrawer-paper"
            tabindex="-1"
          >
            <div
              class="css-exvw6m"
            >
              <div
                class="PanelHeaderroot css-11xy5bc"
              >
                <button
                  class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall PanelHeaderglyph css-8prnfn-MuiButtonBase-root-MuiIconButton-root"
                  data-testid="createChannelPanelClose"
                  tabindex="0"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                    data-testid="ArrowBackIcon"
                    focusable="false"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                    />
                  </svg>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </button>
                <span
                  class="PanelHeadercentre"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body1 PanelHeadertitle css-ghvhpl-MuiTypography-root"
                    data-testid="createChannelPanelTitle"
                  >
                    Create channel
                  </p>
                </span>
              </div>
              <form>
                <div
                  class="css-g5nfir"
                >
                  <div
                    class="TextFieldroot css-jz4vfq"
                  >
                    <p
                      class="MuiTypography-root MuiTypography-body1 TextFieldlabel css-ghvhpl-MuiTypography-root"
                      data-testid="channelName-field-label"
                    >
                      Channel name
                    </p>
                    <div
                      class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-3wyanu-MuiFormControl-root-MuiTextField-root"
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
                  </div>
                </div>
                <div
                  class="css-g5nfir"
                >
                  <button
                    class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium CreateChannelComponentbutton css-1frwc0s-MuiButtonBase-root-MuiButton-root"
                    data-testid="channelNameSubmit"
                    tabindex="0"
                    type="submit"
                  >
                    Create channel
                    <span
                      class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                    />
                  </button>
                </div>
              </form>
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

    const button = screen.getByTestId('channelNameSubmit')
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

  it('hides private channel creation when permissions disallow it', async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    await factory.create('Identity', { nickname: 'alice' })
    await factory.create('ChannelPermissions', {
      genericPermissions: {
        public: { create: true, delete: true },
        private: { create: false },
      },
    })

    renderComponent(<CreateChannel />, store)
    await act(async () => {
      store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))
    })

    expect(await screen.findByTestId('createChannelPanelTitle')).toBeVisible()
    expect(screen.queryByText('Private channel')).toBeNull()
    expect(screen.queryByTestId('createChannel-private-form-control-toggle')).toBeNull()
  })

  it('shows private channel creation when permissions allow it', async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    await factory.create('Identity', { nickname: 'alice' })
    await factory.create('ChannelPermissions')

    renderComponent(<CreateChannel />, store)
    await act(async () => {
      store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))
    })

    expect(await screen.findByText('Private channel')).toBeVisible()
    expect(screen.getByTestId('createChannel-private-form-control-toggle')).toBeVisible()
  })

  /**
   * The private row is the toggle's <label>, as the FormControlLabel it replaced was: pressing the
   * words has to work as well as pressing the switch, and pressing the switch must fire once
   * rather than twice. Regression cover — the row was inert for a while after the panel rework.
   */
  const renderPrivatePanel = () => {
    const createChannel = jest.fn()
    renderComponent(
      <CreateChannelComponent
        open={true}
        createChannel={createChannel}
        handleClose={() => {}}
        clearErrorsDispatch={() => {}}
        canCreateChannel={true}
        canCreatePrivateChannel={true}
      />
    )
    const toggle = () => screen.getByRole('checkbox', { name: /Private channel/ })
    return { createChannel, toggle }
  }

  it('names the private toggle by its row', () => {
    const { toggle } = renderPrivatePanel()
    expect(toggle()).not.toBeChecked()
  })

  it('toggles private when the row is pressed, not only when the switch is', async () => {
    const { toggle } = renderPrivatePanel()

    await userEvent.click(screen.getByTestId('createChannel-private-row'))
    expect(toggle()).toBeChecked()

    await userEvent.click(screen.getByTestId('createChannel-private-row'))
    expect(toggle()).not.toBeChecked()
  })

  it('toggles once, not twice, when the switch itself is pressed', async () => {
    const { toggle } = renderPrivatePanel()

    await userEvent.click(screen.getByTestId('createChannel-private-form-control-toggle'))
    expect(toggle()).toBeChecked()
  })

  it('creates the channel private once the row has been pressed', async () => {
    const { createChannel } = renderPrivatePanel()

    await userEvent.click(screen.getByTestId('createChannel-private-row'))
    await userEvent.type(screen.getByPlaceholderText('Enter a channel name'), 'fundraising')
    await userEvent.click(screen.getByTestId('channelNameSubmit'))

    await waitFor(() => expect(createChannel).toHaveBeenCalledWith('fundraising', false))
  })
})
