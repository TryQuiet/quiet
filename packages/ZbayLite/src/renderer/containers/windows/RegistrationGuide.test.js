/* eslint import/first: 0 */

import { mapDispatchToProps } from './RegistrationGuide'

describe('SyncLoader', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
