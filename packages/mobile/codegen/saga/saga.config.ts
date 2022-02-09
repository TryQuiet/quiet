import chalk from 'chalk';
import {readdirSync} from 'fs';
import {Answers} from 'inquirer';

import {composeValidators} from '../composeValidators.helper';
import {PlopGeneratorConfig} from '../PlopGeneratorConfig.type';
import {requireCamelCase} from '../requireCamelCase.helper';
import {requireInput} from '../requireInput.helper';
import {baseSagaActions, transformSagaActions} from './saga.actions';
import {sagaConst} from './saga.const';

export const sagaConfig: PlopGeneratorConfig = {
  actions: answers => {
    if (!answers || !answers[sagaConst.vars.shouldGenerateCode]) {
      return [];
    }

    if (answers[sagaConst.vars.actionType] === 'none') {
      return baseSagaActions;
    }

    return [...baseSagaActions, ...transformSagaActions];
  },
  description: 'Generate a saga.',
  prompts: [
    {
      message: 'Saga name (camel case string):',
      name: sagaConst.vars.name,
      type: 'input',
      validate: composeValidators(
        requireInput('Saga name cannot be empty!'),
        requireCamelCase('Saga name must be in camel case!'),
      ),
    },
    {
      choices: (): string[] => {
        const directories = readdirSync(`${process.cwd()}/src/store`, {
          withFileTypes: true,
        })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        return directories;
      },
      message: 'Choose a module for your saga:',
      name: sagaConst.vars.storeModule,
      type: 'list',
    },
    {
      choices: (answers: Answers): string[] => {
        const moduleName = answers[sagaConst.vars.storeModule];
        const actionsExportName = `${moduleName}Actions`;

        const actions =
          require(`../../src/store/${moduleName}/${moduleName}.slice`)[
            actionsExportName
          ];

        return [...Object.keys(actions), 'none'];
      },
      message: 'Choose an action type your saga will listen to:',
      name: sagaConst.vars.actionType,
      type: 'list',
    },
    {
      choices: [
        {name: 'Yes', value: true},
        {name: 'No', value: false},
      ],
      message: (answers: Answers): string =>
        `Do you want to generate ${chalk.green(
          answers[sagaConst.vars.name],
        )} saga?`,
      name: sagaConst.vars.shouldGenerateCode,
      type: 'list',
    },
  ],
};
