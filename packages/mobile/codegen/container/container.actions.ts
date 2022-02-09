import {ActionType} from 'plop';

import {containerConst} from './container.const';

export const containerActions: ActionType[] = [
  {
    path: `src/containers/{{ ${containerConst.vars.name} }}/{{ ${containerConst.vars.name} }}.container.tsx`,
    template: require('./templates/template.container').template,
    type: 'add',
  },
  {
    path: `src/containers/{{ ${containerConst.vars.name} }}/{{ ${containerConst.vars.name} }}.test.tsx`,
    template: require('./templates/template.test').template,
    type: 'add',
  },
];
