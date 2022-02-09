import {Answers} from 'inquirer';
import {ActionType} from 'plop';

import {componentConst} from './component.const';

export const componentActions: ActionType[] = [
  {
    path: `src/components/{{ ${componentConst.vars.name} }}/{{ ${componentConst.vars.name} }}.component.tsx`,
    template: require('./templates/template.component').template,
    type: 'add',
  },
  {
    path: `src/components/{{ ${componentConst.vars.name} }}/{{ ${componentConst.vars.name} }}.styles.ts`,
    template: require('./templates/template.styles').template,
    type: 'add',
  },
  {
    path: `src/components/{{ ${componentConst.vars.name} }}/{{ ${componentConst.vars.name} }}.types.ts`,
    template: require('./templates/template.types').template,
    type: 'add',
  },
  {
    path: `src/components/{{ ${componentConst.vars.name} }}/{{ ${componentConst.vars.name} }}.stories.tsx`,
    template: require('./templates/template.stories').template,
    type: 'add',
  },
  {
    path: `src/components/{{ ${componentConst.vars.name} }}/{{ ${componentConst.vars.name} }}.test.tsx`,
    template: require('./templates/template.test').template,
    type: 'add',
  },
  {
    path: 'storybook/index.js',
    transform: (fileContent: string, answers: Answers): string => {
      const name = answers[componentConst.vars.name];
      const requireRegex = /require.+/u;
      const storyImport = `require('../src/components/${name}/${name}.stories')`;

      return fileContent.replace(
        requireRegex,
        (matchedValue: string): string => {
          return `${matchedValue}\n${storyImport}`;
        },
      );
    },
    type: 'modify',
  },
];
