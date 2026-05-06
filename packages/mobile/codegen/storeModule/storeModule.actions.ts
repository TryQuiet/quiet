import {Answers} from 'inquirer';
import {ActionType} from 'plop';

import {toPascalCase} from '../toPascalCase';
import {storeModuleConst} from './storeModule.const';

export const storeModuleActions: ActionType[] = [
  {
    path: `src/store/{{ ${storeModuleConst.vars.name} }}/{{ ${storeModuleConst.vars.name} }}.master.saga.ts`,
    template: require('./templates/template.master.saga').template,
    type: 'add',
  },
  {
    path: `src/store/{{ ${storeModuleConst.vars.name} }}/{{ ${storeModuleConst.vars.name} }}.slice.ts`,
    template: require('./templates/template.slice').template,
    type: 'add',
  },
  {
    path: `src/store/{{ ${storeModuleConst.vars.name} }}/{{ ${storeModuleConst.vars.name} }}.selectors.ts`,
    template: require('./templates/template.selectors').template,
    type: 'add',
  },
  {
    path: `src/store/{{ ${storeModuleConst.vars.name} }}/{{ ${storeModuleConst.vars.name} }}.adapter.ts`,
    template: require('./templates/template.adapter').template,
    type: 'add',
  },
  {
    path: 'src/store/root.saga.ts',
    transform: (fileContent: string, answers: Answers): string => {
      const name = answers[storeModuleConst.vars.name];
      const forkRegex = /fork\(/u;

      const fileContentWithForkedSaga = fileContent.replace(
        forkRegex,
        (matchedValue: string): string => {
          return `fork(${name}MasterSaga),${matchedValue}`;
        },
      );

      return `${fileContentWithForkedSaga}\n import { ${name}MasterSaga } from './${name}/${name}.master.saga'`;
    },
    type: 'modify',
  },
  {
    path: 'src/store/store.keys.ts',
    transform: (fileContent: string, answers: Answers): string => {
      const storeKeysRegex = /StoreKeys.+/u;
      const pascalCaseName = toPascalCase(answers[storeModuleConst.vars.name]);

      return fileContent.replace(
        storeKeysRegex,
        (matchedValue: string): string => {
          return `${matchedValue} ${pascalCaseName} = '${pascalCaseName}',`;
        },
      );
    },
    type: 'modify',
  },
  {
    path: 'src/store/root.reducer.ts',
    transform: (fileContent: string, answers: Answers): string => {
      const combineReducersRegex = /combineReducers\(\{/u;
      const name = answers[storeModuleConst.vars.name];
      const pascalCaseName = toPascalCase(name);
      const importString = `import { ${name}Reducer } from './${name}/${name}.slice'`;

      const fileContentWithReducer = fileContent.replace(
        combineReducersRegex,
        (matchedValue: string): string => {
          return `${matchedValue} [StoreKeys.${pascalCaseName}]: ${name}Reducer,`;
        },
      );

      return `${importString}\n ${fileContentWithReducer}`;
    },
    type: 'modify',
  },
];
