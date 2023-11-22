import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { CreateCommunity } from '../CreateCommunity.component'

describe('Spinner component', () => {
    it('renders component', () => {
        const { toJSON } = renderComponent(
            <CreateCommunity createCommunityAction={jest.fn()} redirectionAction={jest.fn()} networkCreated={false} />
        )
        expect(toJSON()).toMatchSnapshot()
    })

    it('renders loading screen if not ready', () => {
        const { toJSON } = renderComponent(
            <CreateCommunity
                createCommunityAction={jest.fn()}
                redirectionAction={jest.fn()}
                networkCreated={false}
                ready={false}
            />
        )
        expect(toJSON()).toMatchSnapshot()
    })
})
