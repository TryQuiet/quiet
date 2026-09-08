import { it, describe, expect, beforeEach } from '@jest/globals'
import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { screen, fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../tests/utils/renderComponent'
import { CreateChannelScreen } from './CreateChannel.screen'
import type { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory } from '@quiet/state-manager'
import type { Store } from '../../store/store.types'
import { prepareStore } from '../../tests/utils/prepareStore'

describe('Create channel', () => {
  let store: Store
  let factory: FactoryGirl
  beforeEach(async () => {
    store = (await prepareStore()).store
    factory = await getReduxStoreFactory(store)
  })

  it.each([
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
    ['!@#$%^&*()', '----------'],
  ])('user inserting wrong channel name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
    renderComponent(<CreateChannelScreen />)

    fireEvent.changeText(screen.getByTestId('input'), name)

    expect(screen.getByText(`#${corrected}`)).toBeVisible()
  })

  it('shows private toggle when permissions allow', async () => {
    await factory.create('ChannelPermissions')
    const { queryByText } = renderComponent(<CreateChannelScreen />, store)
    expect(queryByText('Private channel')).not.toBeNull()
  })

  it('hides private toggle when permissions disallow', async () => {
    const { queryByText } = renderComponent(<CreateChannelScreen />, store)
    expect(queryByText('Private channel')).toBeNull()
  })
})
