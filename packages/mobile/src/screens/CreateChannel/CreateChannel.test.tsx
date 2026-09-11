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
import Config from 'react-native-config'

const mutableConfig = Config as typeof Config & {
  PRIVATE_CHANNEL_CREATION_ALLOWED?: string
}

describe('Create channel', () => {
  let store: Store
  let factory: FactoryGirl
  beforeEach(async () => {
    mutableConfig.PRIVATE_CHANNEL_CREATION_ALLOWED = 'false'
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

  it('hides private toggle by default even when permissions allow', async () => {
    await factory.create('ChannelPermissions')
    const { queryByText } = renderComponent(<CreateChannelScreen />, store)
    expect(queryByText('Private channel')).toBeNull()
  })

  it('shows private toggle when the feature flag and permissions allow', async () => {
    mutableConfig.PRIVATE_CHANNEL_CREATION_ALLOWED = 'true'
    await factory.create('ChannelPermissions')
    const { queryByText } = renderComponent(<CreateChannelScreen />, store)
    expect(queryByText('Private channel')).not.toBeNull()
  })

  it('hides private toggle when permissions disallow even if the feature flag is enabled', async () => {
    mutableConfig.PRIVATE_CHANNEL_CREATION_ALLOWED = 'true'
    const { queryByText } = renderComponent(<CreateChannelScreen />, store)
    expect(queryByText('Private channel')).toBeNull()
  })
})
