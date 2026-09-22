import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { JoinCommunity } from '../JoinCommunity.component'

describe('JoinCommunity component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(<JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders loading screen if not ready', () => {
    const { toJSON } = renderComponent(
      <JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} ready={false} />
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('shows an invite link error when the pasted value cannot be parsed', () => {
    const joinCommunityAction = jest.fn()
    const { getByPlaceholderText, getByTestId, getByText } = renderComponent(
      <JoinCommunity joinCommunityAction={joinCommunityAction} hasReceivedResponse={false} />
    )

    fireEvent.changeText(getByPlaceholderText('Link'), 'nqnw4kc4c77fb47lk52m5l57h4tc')
    fireEvent.press(getByTestId('paste-link-continue'))

    expect(getByText('Please check your invite link and try again')).toBeTruthy()
    expect(joinCommunityAction).not.toHaveBeenCalled()
  })

  // The prototype draws the two QR flows as titled sheets (2811:2460, 2811:2587); here they are
  // full screens under their own heading, and a page with a heading gets no bar title.
  it.each([
    ['qrCode' as const, 'Join with QR code'],
    ['deviceLink' as const, 'Scan QR code'],
  ])('renders the %s variant with the bar zone empty: the heading is the title', (variant, heading) => {
    const { getByTestId, getAllByText, queryByTestId } = renderComponent(
      <JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} variant={variant} />
    )

    expect(getByTestId('appbar_without_title')).toBeTruthy()
    expect(queryByTestId('appbar_title')).toBeNull()
    // The words appear once, as the heading — not again in the bar.
    expect(getAllByText(heading)).toHaveLength(1)
  })

  it('keeps the bar zone empty on the invite-link variant too', () => {
    const { getByTestId, getAllByText } = renderComponent(
      <JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} />
    )

    expect(getByTestId('appbar_without_title')).toBeTruthy()
    expect(getAllByText('Paste a link to Join')).toHaveLength(1)
  })
})
