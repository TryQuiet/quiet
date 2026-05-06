import {componentConst} from '../component.const';

export const template = `
import React, { FC } from 'react'

import { Styled{{ ${componentConst.vars.name} }} } from './{{ ${componentConst.vars.name} }}.styles'
import { {{ ${componentConst.vars.name} }}Props } from './{{ ${componentConst.vars.name} }}.types'

export const {{ ${componentConst.vars.name} }}: FC<{{ ${componentConst.vars.name} }}Props> = ({ style }) => {
  return <Styled{{ ${componentConst.vars.name} }} style={style}>{'{{ ${componentConst.vars.name} }}'}</Styled{{ ${componentConst.vars.name} }}>
}
`;
