import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { prepareStore } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'
import SettingsModalContainer from './SettingsModal'
import { modalsActions } from '../../../sagas/modals/modals.slice'
import { ModalName } from '../../../sagas/modals/modals.types'

describe('SettingsModal', () => {
  it("doesn't break if there's no community yet", async () => {
    const { store } = await prepareStore()

    store.dispatch(modalsActions.openModal({ name: ModalName.accountSettingsModal }))

    renderComponent(
      <>
        <SettingsModalContainer />
      </>,
      store
    )

    const modalTitle = screen.getByText('Settings')
    expect(modalTitle).toBeVisible()
  })
})
