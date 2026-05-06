import {componentConst} from '../component.const';

export const template = `
import { TextStyle } from 'react-native'

export interface {{ ${componentConst.vars.name} }}Props {
  style?: TextStyle
}
`;
