import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { JoinCommunity } from '../JoinCommunity.component'

describe('JoinCommunity component', () => {
  it('renders component', () => {
    const { getByText, toJSON } = renderComponent(
      <JoinCommunity joinCommunityAction={jest.fn()} redirectionAction={jest.fn()} hasReceivedResponse={false} />
    )
    expect(getByText("Quiet is in beta and shouldn't be used for activities requiring security.")).toBeTruthy()
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
})
