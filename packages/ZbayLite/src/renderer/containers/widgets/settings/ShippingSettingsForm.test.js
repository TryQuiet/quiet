/* eslint import/first: 0 */

import { mapDispatchToProps } from './AccountSettingsForm'

describe('AccountSettingsForm', () => {
  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
