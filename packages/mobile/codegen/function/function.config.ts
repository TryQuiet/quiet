import chalk from 'chalk';
import {Answers} from 'inquirer';

import {composeValidators} from '../composeValidators.helper';
import {PlopGeneratorConfig} from '../PlopGeneratorConfig.type';
import {requireCamelCase} from '../requireCamelCase.helper';
import {requireInput} from '../requireInput.helper';
import {functionActions} from './function.actions';
import {functionConst} from './function.const';

export const functionConfig: PlopGeneratorConfig = {
  actions: answers => {
    if (!answers || !answers[functionConst.vars.shouldGenerateCode]) {
      return [];
    }

    return functionActions;
  },
  description: 'Generate a helper function.',
  prompts: [
    {
      message: 'Function name (camel case string):',
      name: functionConst.vars.name,
      type: 'input',
      validate: composeValidators(
        requireInput('Function name cannot be empty!'),
        requireCamelCase('Function name must be in camel case!'),
      ),
    },
    {
      choices: [
        {name: 'Yes', value: true},
        {name: 'No', value: false},
      ],
      message: (answers: Answers): string =>
        `Do you want to generate ${chalk.green(
          answers[functionConst.vars.name],
        )} function?`,
      name: functionConst.vars.shouldGenerateCode,
      type: 'list',
    },
  ],
};
