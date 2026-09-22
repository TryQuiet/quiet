import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

for (const manual of [false, true]) test(`notification desktop child uses ${manual ? 'live hCaptcha' : 'CI enrollment'} and enables push`, t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-notification-desktop-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const capture = path.join(directory, 'environment.json')
  const driver = path.join(directory, 'driver.cjs')
  fs.writeFileSync(driver, `require('fs').writeFileSync(${JSON.stringify(capture)}, JSON.stringify({
    qps: process.env.QPS_ALLOWED, qss: process.env.QSS_ALLOWED, endpoint: process.env.QSS_ENDPOINT, e2e: process.env.IS_E2E, tokenFile: process.env.QUIET_E2E_CI_ENROLLMENT_TOKEN_FILE
  })); setInterval(() => {}, 1000);`)
  const script = `
    import { Desktop } from './desktop.mjs';
    import { once } from 'node:events';
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    const desktop = new Desktop(
      { qssTarget: 'staging', stagingEnrollment: ${JSON.stringify(manual ? 'manual' : 'github-oidc')}, desktopBinary: process.execPath, chromeDriverPath: ${JSON.stringify(driver)} },
      { desktop: 'notification-sender' },
      { target: 'staging', endpoint: 'wss://qss-dev.quiet-services.app' },
      { directory: ${JSON.stringify(directory)} }
    );
    // Exercise the real create() enrollment gate before starting its UI.
    desktop.app.open = async () => { throw new Error('reached-app-open'); };
    await assert.rejects(desktop.create(), ${manual ? '/reached-app-open/' : '/trusted GitHub Actions/'});
    assert.equal(fs.existsSync(${JSON.stringify(path.join(directory, 'ci-enrollment.jwt'))}), false);
    try { await desktop.app.buildSetup.createChromeDriver(true); }
    finally {
      const child = desktop.app.buildSetup.child;
      if (child && child.exitCode === null) {
        const exited = once(child, 'exit'); child.kill(); await exited;
      }
    }
  `
  const environment = { ...process.env, APPDATA: directory, QPS_ALLOWED: 'false', IS_E2E: 'true', QUIET_E2E_CI_ENROLLMENT_TOKEN_FILE: '/inherited/token', CI: 'false', GITHUB_ACTIONS: 'false' }
  delete environment.NODE_TEST_CONTEXT
  delete environment.QUIET_QSS_LOCAL_FIXTURE_OUTPUT
  delete environment.QUIET_E2E_QSS_ONLY
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), env: environment, encoding: 'utf8', timeout: 30000,
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(fs.readFileSync(capture, 'utf8')), {
    qps: 'true', qss: 'true', endpoint: 'wss://qss-dev.quiet-services.app',
    e2e: manual ? 'false' : 'true',
    ...(manual ? {} : { tokenFile: path.join(directory, 'ci-enrollment.jwt') }),
  })
})

for (const failureStage of ['desktop-open', 'desktop-server-offer', 'desktop-enrollment']) {
  test(`desktop failure receipt identifies ${failureStage} without private UI values`, t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-desktop-progress-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const script = `
      import { Desktop } from './desktop.mjs';
      import selectors from '../../../e2e-tests/src/selectors.ts';
      import assert from 'node:assert/strict';
      import fs from 'node:fs';
      const failure = new Error('PRIVATE_COMMUNITY_AND_INVITATION');
      const stage = ${JSON.stringify(failureStage)};
      const step = name => async () => { if (name === stage) throw failure; };
      const desktop = new Desktop({ desktopBinary: process.execPath },
        { desktop: 'PRIVATE_USERNAME', community: 'PRIVATE_COMMUNITY' },
        { endpoint: 'ws://localhost:3003' }, { directory: ${JSON.stringify(directory)} });
      desktop.app.open = step('desktop-open');
      desktop.app.thenableWebDriver = {};
      desktop.app.buildSetup.child = { pid: process.pid };
      for (const [klass, method, label] of [
        ['JoinCommunityModal', 'switchToCreateCommunity', 'desktop-create-form'],
        ['CreateCommunityModal', 'typeCommunityName', 'type-community'],
        ['CreateCommunityModal', 'submit', 'desktop-community-submit'],
        ['ServerOfferModal', 'chooseUseServer', 'desktop-server-offer'],
        ['RegisterUsernameModal', 'typeUsername', 'desktop-username'],
        ['RegisterUsernameModal', 'submit', 'submit-username'],
        ['TermsOfServiceModal', 'chooseAgreeAndJoin', 'desktop-terms'],
        ['JoiningLoadingPanel', 'waitForJoinToComplete', 'desktop-enrollment'],
      ]) selectors[klass].prototype[method] = step(label);
      await assert.rejects(desktop.create(), error => error === failure);
      const text = fs.readFileSync(${JSON.stringify(path.join(directory, 'progress.json'))}, 'utf8');
      assert.deepEqual(JSON.parse(text), { stage });
      assert(!text.includes('PRIVATE_'));
    `
    const environment = { ...process.env }
    delete environment.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      cwd: fileURLToPath(new URL('..', import.meta.url)), env: environment, encoding: 'utf8', timeout: 30000,
    })
    assert.equal(result.status, 0, result.stderr)
  })
}


test('the shared create-community selector works outside Jest', async t => {
  const module = await import('../../../../e2e-tests/src/selectors.ts')
  const selectors = module.default || module
  const events = []
  const modal = new selectors.JoinCommunityModal({})
  modal.isPresent = async () => false
  t.mock.method(selectors.GetStartedModal.prototype, 'isReady', async () => { events.push('ready'); return true })
  t.mock.method(selectors.GetStartedModal.prototype, 'createCommunity', async () => { events.push('create') })
  assert.equal(typeof globalThis.expect, 'undefined')
  await modal.switchToCreateCommunity()
  assert.deepEqual(events, ['ready', 'create'])
})
