import { renderScreen } from '../../utils/functions/renderScreen/renderScreen'
import { NotifierScreen } from './Notifier.screen'

describe('NotifierScreen', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderScreen(NotifierScreen)

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
