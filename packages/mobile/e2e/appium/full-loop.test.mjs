import test from 'node:test'
import { runScenario } from './scenarios.mjs'
test('QSS -> provider -> native receiver -> OS notification -> conversation', { timeout: 600000 }, async t => runScenario(t, true))
