
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const addon = require('./leveldown.node');

export default addon