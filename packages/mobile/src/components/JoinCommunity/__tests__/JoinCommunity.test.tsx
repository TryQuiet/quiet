import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { JoinCommunity } from '../JoinCommunity.component'

describe('JoinCommunity component', () => {
    it('renders component', () => {
        const { toJSON } = renderComponent(
            <JoinCommunity joinCommunityAction={jest.fn()} redirectionAction={jest.fn()} networkCreated={false} />
        )
        expect(toJSON()).toMatchSnapshot()
    })

    it('renders loading screen if not ready', () => {
        const { toJSON } = renderComponent(
            <JoinCommunity
                joinCommunityAction={jest.fn()}
                redirectionAction={jest.fn()}
                networkCreated={false}
                ready={false}
            />
        )
        expect(toJSON()).toMatchSnapshot()
    })
})
