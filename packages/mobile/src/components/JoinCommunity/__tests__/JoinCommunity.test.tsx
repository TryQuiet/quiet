import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { JoinCommunity } from '../JoinCommunity.component'

describe('JoinCommunity component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(
      <JoinCommunity joinCommunityAction={jest.fn()} redirectionAction={jest.fn()} hasReceivedResponse={false} />
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders loading screen if not ready', () => {
    const { toJSON } = renderComponent(
      <JoinCommunity
        joinCommunityAction={jest.fn()}
        redirectionAction={jest.fn()}
        hasReceivedResponse={false}
        ready={false}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('shows an invite link error when the pasted value cannot be parsed', () => {
    const joinCommunityAction = jest.fn()
    const { getByPlaceholderText, getByTestId, getByText } = renderComponent(
      <JoinCommunity
        joinCommunityAction={joinCommunityAction}
        redirectionAction={jest.fn()}
        hasReceivedResponse={false}
      />
    )

    fireEvent.changeText(getByPlaceholderText('Invite link'), 'nqnw4kc4c77fb47lk52m5l57h4tc')
    fireEvent.press(getByTestId('button'))

    expect(getByText('Please check your invite link and try again')).toBeTruthy()
    expect(joinCommunityAction).not.toHaveBeenCalled()
  })
})
