import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { communities, StoreKeys as StateManagerStoreKeys } from '@quiet/state-manager'
import { InvitationKind } from '@quiet/types'
import { validInvitationDatav4 } from '@quiet/common'
import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'
import { SocketState } from '../../sagas/socket/socket.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import { ModalsInitialState } from '../../sagas/modals/modals.slice'
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

const findEntry = () => screen.findByRole('heading', { name: 'Let’s get started...', level: 3 })

describe('Get started', () => {
  it('is the first screen once the app is connected without a community', async () => {
    const { store } = await prepareStore(freshInstall)

    renderComponent(<GetStarted />, store)

    expect(await findEntry()).toBeVisible()
    expect(screen.getByTestId('onboardingBetaWarning')).toBeVisible()
    // There is nothing to close it into: no community yet
    expect(screen.queryByTestId('getStartedModalClose')).not.toBeInTheDocument()
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

    expect(screen.queryByRole('heading', { name: 'Let’s get started...' })).not.toBeInTheDocument()
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
    expect(await screen.findByRole('heading', { name: 'Join community', level: 3 })).toBeVisible()
    await userEvent.click(screen.getByTestId('joinCommunityModalBack'))

    await findEntry()
    await userEvent.click(screen.getByTestId('get-started-create'))
    expect(await screen.findByRole('heading', { name: 'Create a community', level: 3 })).toBeVisible()
    await userEvent.click(screen.getByTestId('createCommunityModalBack'))

    await findEntry()
    await userEvent.click(screen.getByTestId('get-started-link-devices'))
    expect(await screen.findByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))

    expect(await findEntry()).toBeVisible()
  })
})
