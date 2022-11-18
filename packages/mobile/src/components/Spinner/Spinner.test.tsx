import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Spinner } from './Spinner.component'

describe('Spinner component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(<Spinner description='Connecting to peers' />)
    expect(toJSON).toMatchInlineSnapshot()
  })
})
