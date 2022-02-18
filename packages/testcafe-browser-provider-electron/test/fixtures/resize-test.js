import { testPage } from '../config';


fixture `Resize`
    .page(testPage);

test('Resize test', async t => {
    await t.resizeWindow(800, 600);

    var newSize = await t.eval(() => ({
        width:  window.innerWidth,
        height: window.innerHeight
    }));

    await t
        .expect(newSize.width).eql(800)
        .expect(newSize.height).eql(600);
});
