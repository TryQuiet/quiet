import press from './utils/press'
import write from './utils/write'
import info from './utils/info'
import { BASIC, LONG, STARTUP } from './utils/consts/timeouts'

const { ios } = info

const username = `user_${Math.random().toString(36).substring(2, 6)}`

describe('User', () => {
    beforeAll(async () => {
        await device.launchApp({ newInstance: true, launchArgs: { detoxDebugVisibility: 'YES' } })
    })

    test('should see join community screen', async () => {
        await waitFor(element(by.text('Join community')))
            .toBeVisible()
            .withTimeout(STARTUP)
    })

    test('enters invitation code', async () => {
        await write(element(by.id('input')), process.env.INVITATION_CODE)

        if (!ios) await device.pressBack()

        await press(element(by.text('Continue')))

        await waitFor(element(by.text('Register a username')))
            .toBeVisible()
            .withTimeout(BASIC)
    })

    test('enters username', async () => {
        await write(element(by.id('input')), username)
        await press(element(by.text('Continue')))
    })

    // test('sees channels list', async () => {
    //     await waitFor(element(by.id('channels_list')))
    //         .toBeVisible()
    //         .withTimeout(STARTUP)
    // })
})
