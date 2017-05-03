import { testPage } from '../config';
import { ClientFunction } from 'testcafe';
import { setElectronDialogHandler, clickOnMenuItem } from 'testcafe-browser-provider-electron';


fixture `Dialog`
    .page(testPage);

const checkDialogHandled = ClientFunction(() => window.dialogResult);

test('Should handle Open Dialog', async t => {
    await setElectronDialogHandler(type => type + ' handled');

    await clickOnMenuItem('Test > Dialog');

    await t.expect(checkDialogHandled()).eql('open-dialog handled');
});
