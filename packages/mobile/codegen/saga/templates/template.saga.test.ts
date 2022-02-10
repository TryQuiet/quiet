import { sagaConst } from '../saga.const';
export const template = `
import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import { {{ ${sagaConst.vars.storeModule} }}Reducer, {{ pascalCase ${sagaConst.vars.storeModule} }}State } from '../{{ ${sagaConst.vars.storeModule} }}.slice';
import { {{ ${sagaConst.vars.name} }}Saga } from './{{ ${sagaConst.vars.name} }}.saga';
describe('{{ ${sagaConst.vars.name} }}Saga', () => {
  test('should be defined', () => {
    expectSaga({{ ${sagaConst.vars.name} }}Saga)
      .withReducer(combineReducers({ [StoreKeys.{{ pascalCase ${sagaConst.vars.storeModule}}}]: {{ ${sagaConst.vars.storeModule} }}Reducer }), {
        [StoreKeys.{{ pascalCase ${sagaConst.vars.storeModule} }}]: {
          ...new {{ pascalCase ${sagaConst.vars.storeModule} }}State(),
        },
      })
      .hasFinalState({
        [StoreKeys.{{ pascalCase ${sagaConst.vars.storeModule} }}]: {
          ...new {{ pascalCase ${sagaConst.vars.storeModule} }}State(),
        },
      })
      .run();
  });
});
`;
