import chalk from 'chalk';
import {Answers} from 'inquirer';

import {composeValidators} from '../composeValidators.helper';
import {PlopGeneratorConfig} from '../PlopGeneratorConfig.type';
import {requireInput} from '../requireInput.helper';
import {requirePascalCase} from '../requirePascalCase.helper';
import {containerActions} from './container.actions';
import {containerConst} from './container.const';

export const containerConfig: PlopGeneratorConfig = {
  actions: answers => {
    if (!answers || !answers[containerConst.vars.shouldGenerateCode]) {
      return [];
    }

    return containerActions;
  },
  description: 'Generate a container.',
  prompts: [
    {
      message: 'Container name (pascal case string):',
      name: containerConst.vars.name,
      type: 'input',
      validate: composeValidators(
        requireInput('Container name cannot be empty!'),
        requirePascalCase('Container name must be in pascal case!'),
      ),
    },
    {
      choices: [
        {name: 'Yes', value: true},
        {name: 'No', value: false},
      ],
      message: (answers: Answers): string =>
        `Do you want to generate ${chalk.green(
          answers[containerConst.vars.name],
        )} container?`,
      name: containerConst.vars.shouldGenerateCode,
      type: 'list',
    },
  ],
};
