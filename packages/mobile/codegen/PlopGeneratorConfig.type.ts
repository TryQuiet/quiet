import {PlopGenerator} from 'plop';

export type PlopGeneratorConfig = Omit<
  PlopGenerator,
  'runActions' | 'runPrompts'
>;
