import test from 'node:test'
import { runScenario } from './scenarios.mjs'
test('Appium fresh mobile join and desktop message (push disabled; not notification coverage)', { timeout: 360000 }, async t => runScenario(t, false))
