import {
  App,
  Channel,
  CreateCommunityModal,
  JoinCommunityModal,
  JoiningLoadingPanel,
  RegisterUsernameModal,
} from '../selectors'
import getPort from 'get-port'
import { fork } from 'child_process'
import path from 'path'

jest.setTimeout(450000)
describe('One Client', () => {
  let app: App
  let dataDirPath: string
  let resourcesPath: string
  const joiningTimeout = 1000

  beforeAll(async () => {
    app = new App()
    await app.open()
  })

  afterAll(async () => {
    await app.close()
  })
  describe('User opens app for the first time', () => {
    it('Get opened app process data', () => {
      const processData = app.buildSetup.getProcessData()
      dataDirPath = processData.dataDirPath
      resourcesPath = processData.resourcesPath
    })

    it('User sees "join community" page and switches to "create community" view by clicking on the link', async () => {
      const joinModal = new JoinCommunityModal(app.driver)
      const isJoinModal = await joinModal.element.isDisplayed()
      expect(isJoinModal).toBeTruthy()

      if (!isJoinModal) {
        const generalChannel = new Channel(app.driver, 'general')
        const isGeneralChannel = await generalChannel.element.isDisplayed()

        expect(isGeneralChannel).toBeTruthy()
      } else {
        await joinModal.switchToCreateCommunity()
      }
    })

    it('User is on "Create community" page, enters valid community name and presses the button', async () => {
      const createModal = new CreateCommunityModal(app.driver)
      const isCreateModal = await createModal.element.isDisplayed()
      expect(isCreateModal).toBeTruthy()
      await createModal.typeCommunityName('testcommunity')
      await createModal.submit()
    })

    it('User sees "register username" page, enters the valid name and submits by clicking on the button', async () => {
      const registerModal = new RegisterUsernameModal(app.driver)
      const isRegisterModal = await registerModal.element.isDisplayed()

      expect(isRegisterModal).toBeTruthy()
      console.log('Registration - vefore typeUsername')
      await registerModal.typeUsername('testuser')
      console.log('Registration - before submit')
      await registerModal.submit()
      console.log('Registration - after submit')
    })

    it(`User waits no longer than ${joiningTimeout / 1000} second(s) to see general channel`, async () => {
      await app.waitForJoining(200)
    })
  })

  if (process.platform === 'linux') {
    // TODO: Fix test for win32 and macos
    describe('User can open the app despite hanging backend process', () => {
      it('User closes the app but leaves hanging backend', async () => {
        const forkArgvs = [
          '-d',
          `${await getPort()}`,
          '-a',
          `${dataDirPath}`,
          '-r',
          `${resourcesPath}`,
          '-p',
          'desktop',
        ]
        const backendBundlePath = path.normalize(require.resolve('backend-bundle'))
        console.log('Spawning backend', backendBundlePath, 'with argvs:', forkArgvs)
        fork(backendBundlePath, forkArgvs)
        await app.close({ forceSaveState: true })
      })

      it('Opens app again', async () => {
        await app.open()
      })

      it('User sees "general channel" page', async () => {
        const generalChannel = new Channel(app.driver, 'general')
        const isGeneralChannel = await generalChannel.element.isDisplayed()
        expect(isGeneralChannel).toBeTruthy()
      })
    })
  }
})
