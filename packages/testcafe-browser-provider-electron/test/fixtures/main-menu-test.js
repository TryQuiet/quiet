import { ClientFunction } from 'testcafe';
import {
    getMainMenuItems,
    getMainMenuItem,
    clickOnMainMenuItem
} from 'testcafe-browser-provider-electron';

import { testPage } from '../config';


fixture `Main Menu`
    .page(testPage);

const checkMainMenuClicked    = ClientFunction(() => window.mainMenuClicked);

test('Should retrieve all main menu items', async t => {
    var items = await getMainMenuItems();

    await t
        .expect(items[0].label).eql('Test')
        .expect(items[0].submenu[0].label).eql('Click')
        .expect(items[0].submenu[1].label).eql('Dialog')
        .expect(items[0].submenu[2].label).eql('New Menu')
        .expect(items[0].submenu[3].label).eql('New Menu');
});

test('Should retrieve main menu snapshot [Labels]', async t => {
    const snapshot = await getMainMenuItem(['Test', 'Click']);

    await t.expect(snapshot.sublabel).eql('item 1');
});

test('Should retrieve main menu snapshot [Indexes]', async t => {
    const snapshot = await getMainMenuItem([{ index: 1 }, { index: 2 }]);

    await t.expect(snapshot.sublabel).eql('item 2');
});

test('Should retrieve main menu snapshot [Labels & Indexes]', async t => {
    let snapshot = await getMainMenuItem(['Test', 'New Menu']);

    await t.expect(snapshot.sublabel).eql('item 3');

    snapshot = await getMainMenuItem(['Test', { label: 'New Menu', index: 2 }]);

    await t.expect(snapshot.sublabel).eql('item 4');
});

test('Should click on main menu [Selector]', async t => {
    await t.click('body');

    await clickOnMainMenuItem(['Test', 'Click']);

    await t.expect(checkMainMenuClicked()).ok();
});

test('Should click on main menu [Snapshot]', async t => {
    await t.click('body');

    const snapshot = await getMainMenuItem(['Test', 'Click']);

    await clickOnMainMenuItem(snapshot);

    await t.expect(checkMainMenuClicked()).ok();
});
