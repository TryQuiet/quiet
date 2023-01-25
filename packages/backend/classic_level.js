
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export const bindings = require('./classic_level.node');

export default bindings