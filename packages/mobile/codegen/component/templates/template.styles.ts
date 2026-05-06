import {componentConst} from '../component.const';

export const template = `
import { Text } from 'react-native'
import styled, { css } from 'styled-components/native'

export const Styled{{ ${componentConst.vars.name} }} = styled(Text)\`
  \${({ theme }) => css\`\`}
\`
`;
