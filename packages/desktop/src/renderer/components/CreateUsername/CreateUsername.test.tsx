import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/dom'
import { renderComponent } from '../../testUtils/renderComponent'

import CreateUsernameComponent from './CreateUsernameComponent'
import { UsernameErrors } from '../../forms/fieldsErrors'

describe('Create username', () => {
  it.each([
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
    ['!@#$%^&*()', '----------'],
  ])('user inserting wrong name "%s" gets corrected "%s"', async (name: string, corrected: string) => {
    renderComponent(<CreateUsernameComponent open={true} registerUsername={() => {}} handleClose={() => {}} />)

    const input = screen.getByPlaceholderText('Enter a username')

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

    const input = screen.getByPlaceholderText('Enter a username')
    const button = screen.getByText('Register')

    await userEvent.type(input, name)
    await userEvent.click(button)

    await waitFor(() => expect(registerUsername).not.toBeCalled())

    const message = await screen.findByText(error)
    expect(message).toBeVisible()
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

      const input = screen.getByPlaceholderText('Enter a username')
      const button = screen.getByText('Register')

      await userEvent.type(input, name)
      await userEvent.click(button)

      await waitFor(() => expect(registerUsername).not.toBeCalled())

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

      const input = screen.getByPlaceholderText('Enter a username')
      const button = screen.getByText('Register')

      await userEvent.type(input, name)
      await userEvent.click(button)

      await waitFor(() => expect(registerUsername).toBeCalledWith(name))
    }
  )
})
