import { ClientFunction } from 'testcafe';
import {
    getContextMenuItems,
    getContextMenuItem,
    clickOnContextMenuItem
} from 'testcafe-browser-provider-electron';

import { testPage } from '../config';


fixture `Context Menu`
    .page(testPage);

const checkContextMenuClicked = ClientFunction(() => window.contextMenuClicked);

test('Should retrieve all context menu items', async t => {
    await t.rightClick('body');

    var items = await getContextMenuItems();

    await t
        .expect(items[0].label).eql('Test')
        .expect(items[1].label).eql('Test 2')
        .expect(items[2].label).eql('New Test')
        .expect(items[3].label).eql('New Test');
});

test('Should retrieve context menu snapshot [Labels]', async t => {
    await t.rightClick('body');

    const snapshot = await getContextMenuItem(['Test']);

    await t.expect(snapshot.sublabel).eql('item 1');
});

test('Should retrieve main menu snapshot [Indexes]', async t => {
    await t.rightClick('body');

    const snapshot = await getContextMenuItem([{ index: 2 }]);

    await t.expect(snapshot.sublabel).eql('item 2');
});

test('Should retrieve main menu snapshot [Labels & Indexes]', async t => {
    await t.rightClick('body');

    let snapshot = await getContextMenuItem(['New Test']);

    await t.expect(snapshot.sublabel).eql('item 3');

    snapshot = await getContextMenuItem([{ label: 'New Test', index: 2 }]);

    await t.expect(snapshot.sublabel).eql('item 4');
});

test('Should click on main menu [Selector]', async t => {
    await t.rightClick('body');

    await clickOnContextMenuItem(['Test']);

    await t.expect(checkContextMenuClicked()).ok();
});

test('Should click on main menu [Snapshot]', async t => {
    await t.rightClick('body');

    const snapshot = await getContextMenuItem(['Test']);

    await clickOnContextMenuItem(snapshot);

    await t.expect(checkContextMenuClicked()).ok();
});
