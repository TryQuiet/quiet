import chalk from 'chalk';
import {NodePlopAPI} from 'plop';

import {componentConfig} from './codegen/component/component.config';
import {componentConst} from './codegen/component/component.const';
import {containerConfig} from './codegen/container/container.config';
import {containerConst} from './codegen/container/container.const';
import {functionConfig} from './codegen/function/function.config';
import {functionConst} from './codegen/function/function.const';
import {sagaConfig} from './codegen/saga/saga.config';
import {sagaConst} from './codegen/saga/saga.const';
import {screenConfig} from './codegen/screen/screen.config';
import {screenConst} from './codegen/screen/screen.const';
import {storeModuleConfig} from './codegen/storeModule/storeModule.config';
import {storeModuleConst} from './codegen/storeModule/storeModule.const';

export default function plopGenerator(plop: NodePlopAPI): void {
  plop.setWelcomeMessage(
    `${chalk.green('[Codegen]')} What do you want to generate?`,
  );

  plop.setGenerator(componentConst.generator, componentConfig);
  plop.setGenerator(containerConst.generator, containerConfig);
  plop.setGenerator(screenConst.generator, screenConfig);
  plop.setGenerator(functionConst.generator, functionConfig);
  plop.setGenerator(storeModuleConst.generator, storeModuleConfig);
  plop.setGenerator(sagaConst.generator, sagaConfig);
}
