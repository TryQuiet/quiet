import { testPage } from '../config';
import { ClientFunction } from 'testcafe';
import { clickOnMenuItem } from 'testcafe-browser-provider-electron';


fixture `Menu`
    .page(testPage);

const checkMainMenuClicked    = ClientFunction(() => window.mainMenuClicked);
const checkContextMenuClicked = ClientFunction(() => window.contextMenuClicked);

test('Should click on main menu', async t => {
    await clickOnMenuItem('Main menu > Test > Click');

    await t.expect(checkMainMenuClicked()).ok();
});

test('Should click on context menu', async t => {
    await t.rightClick('body');

    await clickOnMenuItem('Context Menu > Test');

    await t.expect(checkContextMenuClicked()).ok();
});
