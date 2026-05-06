import {functionConst} from '../function.const';

export const template = `
import { {{ ${functionConst.vars.name} }} } from './{{ ${functionConst.vars.name} }}'

describe('{{ ${functionConst.vars.name} }} function', () => {
  it('should be defined', () => {
    expect({{ ${functionConst.vars.name} }}).toBeDefined()
  })
})

`;
