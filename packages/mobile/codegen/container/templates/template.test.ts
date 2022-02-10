import {containerConst} from '../container.const';

export const template = `
import { renderScreen } from '../../utils/functions/renderScreen/renderScreen'
import { {{ ${containerConst.vars.name} }}Container } from './{{ ${containerConst.vars.name} }}.container'

describe('{{ ${containerConst.vars.name} }}Container', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderScreen({{ ${containerConst.vars.name} }}Container)

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
`;
