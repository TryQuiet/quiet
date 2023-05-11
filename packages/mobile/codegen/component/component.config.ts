import chalk from 'chalk';
import {Answers} from 'inquirer';
import {composeValidators} from '../composeValidators.helper';
import {PlopGeneratorConfig} from '../PlopGeneratorConfig.type';
import {requireInput} from '../requireInput.helper';
import {requirePascalCase} from '../requirePascalCase.helper';
import {componentActions} from './component.actions';
import {componentConst} from './component.const';

export const componentConfig: PlopGeneratorConfig = {
  actions: answers => {
    if (!answers || !answers[componentConst.vars.shouldGenerateCode]) {
      return [];
    }

    return componentActions;
  },

  description: 'Generate a component.',
  prompts: [
    {
      message: 'Component name (pascal case string):',
      name: componentConst.vars.name,
      type: 'input',
      validate: composeValidators(
        requireInput('Component name cannot be empty!'),
        requirePascalCase('Component name must be in pascal case!'),
      ),
    },
    {
      choices: [
        {name: 'Yes', value: true},
        {name: 'No', value: false},
      ],
      message: (answers: Answers): string =>
        `Do you want to generate ${chalk.green(
          answers[componentConst.vars.name],
        )} component?`,
      name: componentConst.vars.shouldGenerateCode,
      type: 'list',
    },
  ],
};
