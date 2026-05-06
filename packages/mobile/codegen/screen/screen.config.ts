import chalk from 'chalk';
import {Answers} from 'inquirer';

import {composeValidators} from '../composeValidators.helper';
import {PlopGeneratorConfig} from '../PlopGeneratorConfig.type';
import {requireInput} from '../requireInput.helper';
import {requirePascalCase} from '../requirePascalCase.helper';
import {screenActions} from './screen.actions';
import {screenConst} from './screen.const';

export const screenConfig: PlopGeneratorConfig = {
  actions: answers => {
    if (!answers || !answers[screenConst.vars.shouldGenerateCode]) {
      return [];
    }

    return screenActions;
  },
  description: 'Generate a screen.',
  prompts: [
    {
      message: 'Screen name (pascal case string):',
      name: screenConst.vars.name,
      type: 'input',
      validate: composeValidators(
        requireInput('Screen name cannot be empty!'),
        requirePascalCase('Screen name must be in pascal case!'),
      ),
    },
    {
      choices: [
        {name: 'Yes', value: true},
        {name: 'No', value: false},
      ],
      message: (answers: Answers): string =>
        `Do you want to generate ${chalk.green(
          answers[screenConst.vars.name],
        )} screen?`,
      name: screenConst.vars.shouldGenerateCode,
      type: 'list',
    },
  ],
};
