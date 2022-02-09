import {componentConst} from '../component.const';

export const template = `
import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { {{ ${componentConst.vars.name} }} } from './{{ ${componentConst.vars.name} }}.component'

storiesOf('{{ ${componentConst.vars.name} }}', module)
  .add('Default', () => <{{ ${componentConst.vars.name} }} />)
`;
