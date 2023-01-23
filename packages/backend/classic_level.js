
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const addon = require('./classic_level.node');
export default addon