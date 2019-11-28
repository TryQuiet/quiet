/* eslint import/first: 0 */
jest.mock('../../../vault')

import { mapDispatchToProps } from './OfferMenuActions'

describe('OfferMenuActions', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x, { history: 'test' })
    expect(actions).toMatchSnapshot()
  })
})
