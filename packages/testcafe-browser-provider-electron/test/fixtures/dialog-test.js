import { ClientFunction } from 'testcafe';
import { setElectronDialogHandler, clickOnMainMenuItem } from 'testcafe-browser-provider-electron';
import { testPage } from '../config';


fixture `Dialog`
    .page(testPage);

const checkDialogHandled = ClientFunction(() => window.dialogResult);

test('Should handle Open Dialog', async t => {
    await t.click('body');

    await setElectronDialogHandler(type => type + ' handled');

    await clickOnMainMenuItem(['Test', 'Dialog']);

    await t.expect(checkDialogHandled()).eql('open-dialog handled');
});
