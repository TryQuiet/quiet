import {Answers} from 'inquirer';
import {ActionType} from 'plop';

import {sagaConst} from './saga.const';

export const baseSagaActions: ActionType[] = [
  {
    path: `src/store/{{ ${sagaConst.vars.storeModule} }}/{{ ${sagaConst.vars.name} }}/{{ ${sagaConst.vars.name} }}.saga.ts`,
    template: require('./templates/template.saga').template,
    type: 'add',
  },
  {
    path: `src/store/{{ ${sagaConst.vars.storeModule} }}/{{ ${sagaConst.vars.name} }}/{{ ${sagaConst.vars.name} }}.saga.test.ts`,
    template: require('./templates/template.saga.test').template,
    type: 'add',
  },
];

export const transformSagaActions: ActionType[] = [
  {
    path: `src/store/{{ ${sagaConst.vars.storeModule} }}/{{ ${sagaConst.vars.storeModule} }}.master.saga.ts`,
    transform: (fileContent: string, answers: Answers): string => {
      const name = answers[sagaConst.vars.name];
      const storeModule = answers[sagaConst.vars.storeModule];
      const actionType = answers[sagaConst.vars.actionType];
      const yieldAllRegex = /yield all\(\[/u;
      const typedReduxSagaRegex = /import .+'typed-redux-saga'/u;
      const moduleActionsRegex = new RegExp(
        `import.+${storeModule}Actions`,
        'u',
      );

      const fileContentWithProperTypedReduxSagaImport = fileContent.replace(
        typedReduxSagaRegex,
        (matchedValue: string): string => {
          if (matchedValue.includes('takeEvery')) {
            return matchedValue;
          }

          return matchedValue.replace(
            /import \{/u,
            (matchedValue: string): string => {
              return `${matchedValue} takeEvery,`;
            },
          );
        },
      );

      const fileContentWithYieldedSaga =
        fileContentWithProperTypedReduxSagaImport.replace(
          yieldAllRegex,
          (matchedValue: string): string => {
            return `${matchedValue}takeEvery(${storeModule}Actions.${actionType}.type ,${name}Saga),`;
          },
        );

      const fileContentWithSagaImport = `${fileContentWithYieldedSaga}\n import { ${name}Saga } from './${name}/${name}.saga'`;

      if (moduleActionsRegex.test(fileContentWithSagaImport)) {
        return fileContentWithSagaImport;
      }

      return `${fileContentWithSagaImport} \n import { ${storeModule}Actions } from './${storeModule}.slice'`;
    },
    type: 'modify',
  },
];
