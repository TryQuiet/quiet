import {screenConst} from '../screen.const';

export const template = `
import { renderScreen } from '../../utils/functions/renderScreen/renderScreen'
import { {{ ${screenConst.vars.name} }}Screen } from './{{ ${screenConst.vars.name} }}.screen'

describe('{{ ${screenConst.vars.name} }}Screen', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderScreen({{ ${screenConst.vars.name} }}Screen)

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
`;
