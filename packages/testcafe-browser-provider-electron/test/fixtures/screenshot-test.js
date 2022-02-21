import path from 'path';
import { statSync } from 'fs';
import { tmpNameSync as getTempFileName } from 'tmp';
import { testPage } from '../config';


fixture `Screenshot`
    .page(testPage);

test('Take screenshot', async t => {
    var screenshotName = getTempFileName({ template: 'screenshot-XXXXXX.png' });
    var screenshotPath = path.join('.screenshots', screenshotName);

    await t.takeScreenshot(screenshotName);

    await t.expect(statSync(screenshotPath).isFile()).ok();
});
