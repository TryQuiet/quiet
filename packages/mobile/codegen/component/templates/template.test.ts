import {componentConst} from '../component.const';

export const template = `
import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { {{ ${componentConst.vars.name} }} } from './{{ ${componentConst.vars.name} }}.component'

describe('{{ ${componentConst.vars.name} }} component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(<{{ ${componentConst.vars.name} }} />)

    expect(toJSON()).toMatchInlineSnapshot()
  })
})
`;
