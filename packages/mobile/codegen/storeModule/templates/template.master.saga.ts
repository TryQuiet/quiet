import {storeModuleConst} from '../storeModule.const';

export const template = `
import { all } from 'typed-redux-saga'

export function* {{ ${storeModuleConst.vars.name} }}MasterSaga(): Generator {
  yield all([])
}
`;
