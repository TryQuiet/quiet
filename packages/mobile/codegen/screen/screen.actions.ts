import {Answers} from 'inquirer';
import {ActionType} from 'plop';

import {screenConst} from './screen.const';

export const screenActions: ActionType[] = [
  {
    path: `src/screens/{{ ${screenConst.vars.name} }}/{{ ${screenConst.vars.name} }}.screen.tsx`,
    template: require('./templates/template.screen').template,
    type: 'add',
  },
  {
    path: `src/screens/{{ ${screenConst.vars.name} }}/{{ ${screenConst.vars.name} }}.test.tsx`,
    template: require('./templates/template.test').template,
    type: 'add',
  },
  {
    path: 'src/const/ScreenNames.enum.ts',
    transform: (fileContent: string, answers: Answers): string => {
      const name = answers[screenConst.vars.name];

      return fileContent.replace(/\{/u, (matchedValue: string): string => {
        return `${matchedValue}${name}Screen = '${name}Screen',`;
      });
    },
    type: 'modify',
  },
  {
    path: 'src/App.tsx',
    transform: (fileContent: string, answers: Answers): string => {
      const name = answers[screenConst.vars.name];
      const screenRouteRegex = /<Screen.+ \/>/u;
      const screenImport = `import { ${name}Screen } from './screens/${name}/${name}.screen'`;
      const screenJSX = `<Screen component={${name}Screen} name={ScreenNames.${name}Screen} />`;

      const fileContentWithRoute = fileContent.replace(
        screenRouteRegex,
        (matchedValue: string): string => {
          return `${matchedValue}${screenJSX}`;
        },
      );

      return `${screenImport}\n${fileContentWithRoute}`;
    },
    type: 'modify',
  },
];
