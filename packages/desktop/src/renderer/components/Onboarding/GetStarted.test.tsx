import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { communities, StoreKeys as StateManagerStoreKeys } from '@quiet/state-manager'
import { InvitationKind } from '@quiet/types'
import {
  CREATE_COMMUNITY_HEADING,
  GET_STARTED_HEADING,
  JOIN_COMMUNITY_HEADING,
  LINK_DEVICES_HEADING,
  validInvitationDatav4,
} from '@quiet/common'
import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'
import { SocketState } from '../../sagas/socket/socket.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import { modalsActions, ModalsInitialState } from '../../sagas/modals/modals.slice'
import GetStarted from './GetStarted'
import LinkDevices from './LinkDevices'
import JoinCommunity from '../CreateJoinCommunity/JoinCommunity/JoinCommunity'
import CreateCommunity from '../CreateJoinCommunity/CreateCommunity/CreateCommunity'

/** Connected, no community, no modal open: what a fresh install looks like once the backend is up. */
const freshInstall = {
  [StoreKeys.Socket]: {
    ...new SocketState(),
    isConnected: true,
  },
  [StoreKeys.Modals]: {
    ...new ModalsInitialState(),
    [ModalName.loadingPanel]: { open: false },
  },
}

const findEntry = () => screen.findByRole('heading', { name: GET_STARTED_HEADING, level: 3 })

describe('Get started', () => {
  it('is the first screen once the app is connected without a community', async () => {
    const { store } = await prepareStore(freshInstall)

    renderComponent(<GetStarted />, store)

    expect(await findEntry()).toBeVisible()
    expect(screen.getByTestId('onboardingBetaWarning')).toBeVisible()
    // No title bar: the window chrome carries the app's name (a deliberate departure from the frame's "Quiet" bar)
    expect(screen.queryByText('Quiet')).not.toBeInTheDocument()
    expect(screen.getByTestId('getStartedModalActions').closest('.Modalheader')).toHaveClass('Modalnone')
    // There is nothing to close it into: no community yet
    expect(screen.queryByTestId('getStartedModalClose')).not.toBeInTheDocument()
  })

  it('stays out of the way while the progress screen is up, and appears once it is gone', async () => {
    const { store } = await prepareStore({
      ...freshInstall,
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.loadingPanel]: { open: true },
      },
    })

    renderComponent(<GetStarted />, store)

    // A community is being created or joined behind the loading panel: no entry screen over it
    expect(screen.queryByRole('heading', { name: GET_STARTED_HEADING })).not.toBeInTheDocument()

    store.dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    expect(await findEntry()).toBeVisible()
  })

  it('stays out of the way while an invitation is being processed', async () => {
    const { store } = await prepareStore({
      ...freshInstall,
      [StateManagerStoreKeys.Communities]: {
        ...new communities.State(),
        invitationCodes: { ...validInvitationDatav4[0], kind: InvitationKind.Member },
      },
    })

    renderComponent(<GetStarted />, store)

    expect(screen.queryByRole('heading', { name: GET_STARTED_HEADING })).not.toBeInTheDocument()
  })

  it('routes to Join community, Create a community and Link devices, and each comes back here', async () => {
    const { store } = await prepareStore(freshInstall)

    renderComponent(
      <>
        <GetStarted />
        <JoinCommunity />
        <CreateCommunity />
        <LinkDevices />
      </>,
      store
    )

    await findEntry()
    await userEvent.click(screen.getByTestId('get-started-join'))
    expect(await screen.findByRole('heading', { name: JOIN_COMMUNITY_HEADING, level: 3 })).toBeVisible()
    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))

    await findEntry()
    await userEvent.click(screen.getByTestId('get-started-create'))
    expect(await screen.findByRole('heading', { name: CREATE_COMMUNITY_HEADING, level: 3 })).toBeVisible()
    await userEvent.click(screen.getByTestId('createCommunityModalBack'))

    await findEntry()
    await userEvent.click(screen.getByTestId('get-started-link-devices'))
    expect(await screen.findByRole('heading', { name: LINK_DEVICES_HEADING, level: 3 })).toBeVisible()
    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))

    expect(await findEntry()).toBeVisible()
  })
})
