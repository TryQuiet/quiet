import { fireEvent } from '@testing-library/react-native'
import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind, type InvitationDataV4 } from '@quiet/types'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { validateInviteLink } from '../../../utils/inviteLink'
import { JoinCommunity } from '../JoinCommunity.component'
import { PASTE_LINK_HEADING, PASTE_LINK_PLACEHOLDER, SCAN_QR_CODE_HEADING } from '@quiet/common'

// The real rule, through a spy: every case below still runs the actual validation, and the
// reuse test can make it say something this component could not have come up with alone.
jest.mock('../../../utils/inviteLink', () => {
  const actual = jest.requireActual('../../../utils/inviteLink')
  return { ...actual, validateInviteLink: jest.fn(actual.validateInviteLink) }
})
const validate = validateInviteLink as jest.MockedFunction<typeof validateInviteLink>

const memberData: InvitationDataV4 = { ...validInvitationDatav4[0], kind: InvitationKind.Member }
const memberLink = composeInvitationShareUrl(validInvitationDatav4[0])

beforeEach(() => validate.mockClear())

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

    fireEvent.changeText(getByPlaceholderText(PASTE_LINK_PLACEHOLDER), 'nqnw4kc4c77fb47lk52m5l57h4tc')
    fireEvent.press(getByTestId('paste-link-continue'))

    expect(getByText('Please check your invite link and try again')).toBeTruthy()
    expect(joinCommunityAction).not.toHaveBeenCalled()
  })

  /**
   * The screen has no rules of its own. It was the pre-redesign Join community screen that
   * decided what an invite link is and what to say when it is not one; that screen is gone
   * and the rule lives in `utils/inviteLink`, so what this asserts is that the field asks it
   * rather than carrying a second copy.
   */
  describe('the join field validation', () => {
    it('asks the shared validation about what was submitted, with the screen’s variant', () => {
      const { getByPlaceholderText, getByTestId } = renderComponent(
        <JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} variant={'pasteDeviceLink'} />
      )

      fireEvent.changeText(getByPlaceholderText('Link'), memberLink)
      fireEvent.press(getByTestId('paste-link-continue'))

      expect(validate).toHaveBeenCalledWith(memberLink, 'pasteDeviceLink')
    })

    it('shows whatever the shared validation says, not a verdict of its own', () => {
      const onlyTheRuleKnows = 'The rule said so'
      const joinCommunityAction = jest.fn()
      const { getByPlaceholderText, getByTestId, getByText } = renderComponent(
        <JoinCommunity joinCommunityAction={joinCommunityAction} hasReceivedResponse={false} />
      )

      validate.mockReturnValueOnce({ error: onlyTheRuleKnows })
      // A link the real rule accepts: only delegation can turn it into an error.
      fireEvent.changeText(getByPlaceholderText('Link'), memberLink)
      fireEvent.press(getByTestId('paste-link-continue'))

      expect(getByText(onlyTheRuleKnows)).toBeTruthy()
      expect(joinCommunityAction).not.toHaveBeenCalled()
    })

    it('passes on exactly the invitation the shared validation parsed', () => {
      const joinCommunityAction = jest.fn()
      const { getByPlaceholderText, getByTestId } = renderComponent(
        <JoinCommunity joinCommunityAction={joinCommunityAction} hasReceivedResponse={false} />
      )

      fireEvent.changeText(getByPlaceholderText('Link'), memberLink)
      fireEvent.press(getByTestId('paste-link-continue'))

      expect(validate).toHaveReturnedWith({ data: memberData })
      expect(joinCommunityAction).toHaveBeenCalledWith(memberData)
    })

    it('reports an empty field the way the old screen did', () => {
      const joinCommunityAction = jest.fn()
      const { getByTestId, getByText } = renderComponent(
        <JoinCommunity joinCommunityAction={joinCommunityAction} hasReceivedResponse={false} />
      )

      fireEvent.press(getByTestId('paste-link-continue'))

      expect(getByText('Community address can not be empty')).toBeTruthy()
      expect(joinCommunityAction).not.toHaveBeenCalled()
    })
  })

  // The prototype draws the two QR flows as titled sheets (2811:2460, 2811:2587); here they are
  // full screens under their own heading, and a page with a heading gets no bar title.
  it.each([['deviceLink' as const, SCAN_QR_CODE_HEADING]])(
    'renders the %s variant with the bar zone empty: the heading is the title',
    (variant, heading) => {
      const { getByTestId, getAllByText, queryByTestId } = renderComponent(
        <JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} variant={variant} />
      )

      expect(getByTestId('appbar_without_title')).toBeTruthy()
      expect(queryByTestId('appbar_title')).toBeNull()
      // The words appear once, as the heading — not again in the bar.
      expect(getAllByText(heading)).toHaveLength(1)
    }
  )

  it('keeps the bar zone empty on the invite-link variant too', () => {
    const { getByTestId, getAllByText } = renderComponent(
      <JoinCommunity joinCommunityAction={jest.fn()} hasReceivedResponse={false} />
    )

    expect(getByTestId('appbar_without_title')).toBeTruthy()
    expect(getAllByText(PASTE_LINK_HEADING)).toHaveLength(1)
  })
})
