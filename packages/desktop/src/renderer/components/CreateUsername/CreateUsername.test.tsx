import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/dom'
import { renderComponent } from '../../testUtils/renderComponent'

import CreateUsernameComponent from './CreateUsernameComponent'
import CreateUsername from './CreateUsername'
import { UsernameErrors } from '../../forms/fieldsErrors'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'
import { ModalName } from '../../sagas/modals/modals.types'
import { ModalsInitialState } from '../../sagas/modals/modals.slice'
import { communities } from '@quiet/state-manager'

describe('Create username', () => {
  it('cancels pending onboarding when the username modal is closed', async () => {
    const { store } = await prepareStore({
      [StoreKeys.Modals]: {
        ...new ModalsInitialState(),
        [ModalName.createUsernameModal]: { open: true },
      },
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<CreateUsername />, store)
    await userEvent.click(screen.getByTestId('createUsernameModalClose'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.cancelCommunityOnboarding())
  })

  it.each([
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
    ['!@#$%^&*()', '----------'],
  ])('user inserting wrong name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
    renderComponent(<CreateUsernameComponent open={true} registerUsername={() => {}} handleClose={() => {}} />)

    const input = screen.getByPlaceholderText('Username')

    await userEvent.type(input, name)
    expect(screen.getByTestId('createUserNameWarning')).toHaveTextContent(
      `Your username will be registered as @${corrected}`
    )
  })

  it('user inserting invalid name "%s" should see "%s" error', async () => {
    const name = '!@#'
    const error = UsernameErrors.WrongCharacter
    const registerUsername = jest.fn()

    renderComponent(<CreateUsernameComponent open={true} registerUsername={registerUsername} handleClose={() => {}} />)

    const input = screen.getByPlaceholderText('Username')
    const button = screen.getByTestId('continue-createUsername')

    await userEvent.type(input, name)
    await userEvent.tab()

    // Continue stays disabled for an invalid name; the error shows once the field is touched.
    await waitFor(() => expect(button).toBeDisabled())
    expect(registerUsername).not.toBeCalled()

    const message = await screen.findByText(error)
    expect(message).toBeVisible()
  })

  it('keeps Continue disabled until the username is valid', async () => {
    const registerUsername = jest.fn()

    renderComponent(<CreateUsernameComponent open={true} registerUsername={registerUsername} handleClose={() => {}} />)

    const input = screen.getByPlaceholderText('Username')
    const button = screen.getByTestId('continue-createUsername')
    await waitFor(() => expect(button).toBeDisabled())

    await userEvent.type(input, 'alice')
    await waitFor(() => expect(button).toBeEnabled())

    await userEvent.click(button)
    await waitFor(() => expect(registerUsername).toBeCalledWith('alice'))
  })

  // https://github.com/TryQuiet/quiet/issues/1306 - a leading hyphen used to be accepted silently.
  // ' holmes' is included because parseName turns the leading space into a hyphen too.
  it.each([['-holmes'], ['-1'], ['--'], [' holmes']])(
    'user inserting name starting with a hyphen "%s" cannot submit and sees an explanation',
    async (name: string) => {
      const registerUsername = jest.fn()

      renderComponent(
        <CreateUsernameComponent open={true} registerUsername={registerUsername} handleClose={() => {}} />
      )

      const input = screen.getByPlaceholderText('Username')
      const button = screen.getByTestId('continue-createUsername')

      await userEvent.type(input, name)
      await userEvent.tab()

      await waitFor(() => expect(button).toBeDisabled())
      expect(registerUsername).not.toBeCalled()

      const message = await screen.findByText(UsernameErrors.LeadingHyphen)
      expect(message).toBeVisible()
    }
  )

  it.each([['holmes'], ['1-holmes'], ['holmes-']])(
    'user inserting name "%s" without a leading hyphen can still submit',
    async (name: string) => {
      const registerUsername = jest.fn()

      renderComponent(
        <CreateUsernameComponent open={true} registerUsername={registerUsername} handleClose={() => {}} />
      )

      const input = screen.getByPlaceholderText('Username')
      const button = screen.getByTestId('continue-createUsername')

      await userEvent.type(input, name)
      await waitFor(() => expect(button).toBeEnabled())

      await userEvent.click(button)

      await waitFor(() => expect(registerUsername).toBeCalledWith(name))
    }
  )
})
