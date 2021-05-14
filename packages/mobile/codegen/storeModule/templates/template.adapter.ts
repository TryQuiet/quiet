import {storeModuleConst} from '../storeModule.const';

export const template = `
import { createEntityAdapter } from '@reduxjs/toolkit'

export const {{ ${storeModuleConst.vars.name} }}Adapter = createEntityAdapter()
`;
