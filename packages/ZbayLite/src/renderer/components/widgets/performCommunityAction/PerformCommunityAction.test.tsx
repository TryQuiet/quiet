import '@testing-library/jest-dom'
import { waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { CommunityAction } from '../../../components/widgets/performCommunityAction/community.keys'
import PerformCommunityActionComponent from '../../../components/widgets/performCommunityAction/PerformCommunityActionComponent'
import { CommunityNameErrors, InviteLinkErrors } from '../../../forms/fieldsErrors'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('PerformCommunityAction component (create community mode)', () => {
  const action = CommunityAction.Create

  it('creates community on submit if connection is ready', async () => {
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />
    const result = renderComponent(component)
    const communityName = 'communityname'
    const textInput = result.queryByPlaceholderText('Community name')
    expect(textInput).not.toBeNull()
    userEvent.type(textInput, communityName)
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeEnabled()
    userEvent.click(submitButton)
    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(communityName))
  })

  it.each([
    ['bu', CommunityNameErrors.NameToShort],
    ['Community Name', CommunityNameErrors.WrongCharacter],
    ['mybeautifulcommunityname', CommunityNameErrors.NameTooLong]
  ])('user inserting invalid community name "%s" should see "%s" error', async (communityName: string, error: string) => {
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />
    const result = renderComponent(component)
    const textInput = result.queryByPlaceholderText('Community name')
    expect(textInput).not.toBeNull()
    userEvent.type(textInput, communityName)
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeEnabled()
    userEvent.click(submitButton)
    await waitFor(() => expect(handleCommunityAction).not.toBeCalled())
    const errorElement = screen.queryByText(error)
    expect(errorElement).not.toBeNull()
  })

  it('blocks submit button if connection is not ready', async () => {
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={false}
      community={false}
    />
    const result = renderComponent(component)
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()
  })

  it('handles redirection if user clicks on the link', async () => {
    const handleRedirection = jest.fn()
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={handleRedirection}
      isConnectionReady={true}
      community={false}
    />
    const result = renderComponent(component)
    const switchLink = result.queryByText('join a community')
    expect(switchLink).not.toBeNull()
    userEvent.click(switchLink)
    expect(handleRedirection).toBeCalled()
    expect(handleCommunityAction).not.toBeCalled()
  })
})

describe('PerformCommunityAction component (join community mode)', () => {
  const action = CommunityAction.Join
  it('joins community on submit if connection is ready and registrar url is correct', async () => {
    const registrarUrl = 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad'
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />
    const result = renderComponent(component)
    const textInput = result.queryByPlaceholderText('Invite link')
    expect(textInput).not.toBeNull()
    userEvent.type(textInput, registrarUrl)
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeEnabled()
    userEvent.click(submitButton)
    await waitFor(() => expect(handleCommunityAction).toBeCalledWith(registrarUrl))
  })

  it.each([
    ['nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad088888', InviteLinkErrors.WrongCharacter],
    ['nqnw4kc4c77fb47lk52m5l57h4tc', InviteLinkErrors.WrongCharacter],
    ['nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olaż', InviteLinkErrors.WrongCharacter],
    ['http://nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion', InviteLinkErrors.WrongCharacter]
  ])('user inserting invalid url %s should see "%s" error', async (registrarUrl: string, error: string) => {
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={true}
      community={false}
    />
    const result = renderComponent(component)
    const textInput = result.queryByPlaceholderText('Invite link')
    expect(textInput).not.toBeNull()
    userEvent.type(textInput, registrarUrl)
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeEnabled()
    userEvent.click(submitButton)
    await waitFor(() => expect(handleCommunityAction).not.toBeCalled())
    const errorElement = screen.queryByText(error)
    expect(errorElement).not.toBeNull()
  })

  it('blocks submit button if connection is not ready', async () => {
    const handleCommunityAction = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={handleCommunityAction}
      handleRedirection={() => { }}
      isConnectionReady={false}
      community={false}
    />
    const result = renderComponent(component)
    const textInput = result.queryByPlaceholderText('Invite link')
    expect(textInput).not.toBeNull()
    userEvent.type(textInput, 'My Community')
    const submitButton = result.queryByRole('button')
    expect(submitButton).not.toBeNull()
    expect(submitButton).toBeDisabled()
    expect(handleCommunityAction).not.toBeCalled()
  })

  it('handles redirection if user clicks on the link', async () => {
    const handleRedirection = jest.fn()
    const component = <PerformCommunityActionComponent
      open={true}
      handleClose={() => { }}
      communityAction={action}
      handleCommunityAction={() => { }}
      handleRedirection={handleRedirection}
      isConnectionReady={true}
      community={false}
    />
    const result = renderComponent(component)
    const switchLink = result.queryByText('create a new community')
    expect(switchLink).not.toBeNull()
    userEvent.click(switchLink)
    expect(handleRedirection).toBeCalled()
  })
})
