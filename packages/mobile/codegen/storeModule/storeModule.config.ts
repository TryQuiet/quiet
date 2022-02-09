import chalk from 'chalk';
import {Answers} from 'inquirer';
import {ActionType} from 'plop';

import {composeValidators} from '../composeValidators.helper';
import {PlopGeneratorConfig} from '../PlopGeneratorConfig.type';
import {requireCamelCase} from '../requireCamelCase.helper';
import {requireInput} from '../requireInput.helper';
import {storeModuleActions} from './storeModule.actions';
import {storeModuleConst} from './storeModule.const';

export const storeModuleConfig: PlopGeneratorConfig = {
  actions: (answers): ActionType[] => {
    if (!answers || !answers[storeModuleConst.vars.shouldGenerateCode]) {
      return [];
    }

    return storeModuleActions;
  },
  description: 'Generate a store module.',
  prompts: [
    {
      message: 'Choose a name for your store module (camel case string):',
      name: storeModuleConst.vars.name,
      type: 'input',
      validate: composeValidators(
        requireInput('Store module name is required!'),
        requireCamelCase('Store module name must be in camel case!'),
      ),
    },
    {
      choices: [
        {name: 'Yes', value: true},
        {name: 'No', value: false},
      ],
      message: (answers: Answers): string =>
        `Do you want to generate ${chalk.green(
          answers[storeModuleConst.vars.name],
        )} store module?`,
      name: storeModuleConst.vars.shouldGenerateCode,
      type: 'list',
    },
  ],
};
