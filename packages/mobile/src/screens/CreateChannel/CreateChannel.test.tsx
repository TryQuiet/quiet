import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { screen, fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../tests/utils/renderComponent'
import { CreateChannelScreen } from './CreateChannel.screen'

describe('Create channel', () => {
  it.each([
    ['double-hyp--hens', 'double-hyp-hens'],
    ['-start-with-hyphen', 'start-with-hyphen'],
    [' start-with-space', 'start-with-space'],
    ['end-with-hyphen-', 'end-with-hyphen'],
    ['end-with-space ', 'end-with-space'],
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
    ['!@#start-with-exclaim-at-hash', 'start-with-exclaim-at-hash']
  ])(
    'user inserting wrong channel name "%s" gets corrected "%s"',
    async (name: string, corrected: string) => {
      renderComponent(
        <CreateChannelScreen />
      )

      fireEvent.changeText(screen.getByTestId('input'), name)

      expect(screen.getByText(`#${corrected}`)).toBeVisible()
    }
  )
})
