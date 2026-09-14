import React from 'react'
import { act } from 'react-dom/test-utils'
import { waitFor } from '@testing-library/dom'
import { connection } from '@quiet/state-manager'
import { type DeviceLinkInvite } from '@quiet/types'

import { prepareStore } from '../../../../testUtils/prepareStore'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { LinkedDevices } from './LinkedDevices'

describe('LinkedDevices', () => {
  it('requests a fresh link on open and after the current link expires', async () => {
    const { store } = await prepareStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LinkedDevices />, store)
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink()))

    const invite: DeviceLinkInvite = {
      id: '5ah8uYodiwuwVybT' as DeviceLinkInvite['id'],
      teamId: '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3' as DeviceLinkInvite['teamId'],
      seed: '4kgd5mwq5z4fmfwq',
      expiresAt: Date.now() + 1_800_000,
      userId: 'user-id',
      userName: 'Alice device owner',
    }
    act(() => store.dispatch(connection.actions.setDeviceLinkInvite(invite)))
    dispatchSpy.mockClear()

    act(() => store.dispatch(connection.actions.setDeviceLinkInvite(undefined)))
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledWith(connection.actions.createDeviceLink()))
  })
})
