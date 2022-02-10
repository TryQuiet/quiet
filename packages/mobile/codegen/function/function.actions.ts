import {ActionType} from 'plop';

import {functionConst} from './function.const';

export const functionActions: ActionType[] = [
  {
    path: `src/utils/functions/{{ ${functionConst.vars.name} }}/{{ ${functionConst.vars.name} }}.ts`,
    template: require('./templates/template.function').template,
    type: 'add',
  },
  {
    path: `src/utils/functions/{{ ${functionConst.vars.name} }}/{{ ${functionConst.vars.name} }}.test.ts`,
    template: require('./templates/template.test').template,
    type: 'add',
  },
];
