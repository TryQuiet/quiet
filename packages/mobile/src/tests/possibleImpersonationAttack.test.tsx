import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { FactoryGirl } from 'factory-girl'
import { getFactory, communities, identity, users } from '@quiet/state-manager'
import { navigationActions } from '../store/navigation/navigation.slice'
import { PossibleImpersonationAttackScreen } from '../screens/PossibleImpersonationAttack/PossibleImpersonationAttack.screen'
import { ScreenNames } from '../const/ScreenNames.enum'
import { navigationSelectors } from '../store/navigation/navigation.selectors'

describe('Possible Impersonation Attack', () => {
  let socket: MockedSocket

  let factory: FactoryGirl

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('Open modal when certifcates are duplicated', async () => {
    const { store, root } = await prepareStore({}, socket)

    factory = await getFactory(store)

    const community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>(
      'Community'
    )

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    const route: { key: string; name: ScreenNames.PossibleImpersonationAttackScreen; path?: string | undefined } = {
      key: '',
      name: ScreenNames.PossibleImpersonationAttackScreen,
    }
    renderComponent(
      <>
        <PossibleImpersonationAttackScreen route={route} />
      </>,
      store
    )

    const cert1 =
      'MIIDeDCCAx6gAwIBAgIGAYr6Jw3hMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBGZyZmQwHhcNMjMxMDA0MTAwNjE4WhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5tenhydWhyNWJzdGt3dmp3eWJnZ2Y2M2Jma2dreWw0aWs0bG5lanN1YnFlaG9td3Vpbm43d3JxZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGcKhXLUNjkS9+xd0hYfJBOA7bXB5LwZojhzgBQps3SW/CSR6ABiAuirdP0x/byxTXSkZY23lBkvc5CqMjWe3lWjggIqMIICJjAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNAXhwXxmLy7Gg5uonlWXiqRUimGLj2cPbAoK9DnKHkcohqdLvEzyz6rM7KBewO068fag0d/PR0uh37Oyb7d/JAbBjhJmf8wOl2HfLTThPEEH8isy3bxHXx4Ir5prVVk1zx8UiXtPAu6gK41FY5Oin6SpV07MBewqQGcbCovcbBSwkp6EXmLXPOGgmpFlQf5CNGIs3YqPD+Ll1vn8Lq5QIGCa210Pq/T65mrPsXVAw2vJO6DFRIAGrAF5VxDS8G2dSwnDnje+bD2NO8qlfwFdO3bkDeheOqZXCSxlPA6q1bY34qYR2zrwSiQCjRiCQjifRCmF2Jg4ojzLGUL0pKdvi+8fDQXollmazh5boJWN9GRy+1sDLTk01cW2kF7esew5PlDi8kX0v2hY+XsR5eQga1j3MkXkMBgGCisGAQQBg4wbAgEEChMIdXNlcm5hbWUwPQYJKwYBAgEPAwEBBDATLlFtUHF6THFheFk1UmI4VlpjM1VuZmlXZXRxVDZKWkp6SnRjWVFXNmhXTENvRXIwSQYDVR0RBEIwQII+bXp4cnVocjVic3Rrd3Zqd3liZ2dmNjNiZmtna3lsNGlrNGxuZWpzdWJxZWhvbXd1aW5uN3dycWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIhAJx4YX8KtOA4WGAWzW0M7FvuoblNOb370521GsfuHfbMAiBEYQ4l074oUEF2DTVK1agJlhMR5USRxav5xEpx2ujMeA=='

    const cert2 =
      'MIIDdzCCAx2gAwIBAgIGAYr6JZFvMAoGCCqGSM49BAMCMA4xDDAKBgNVBAMTA2RldjAeFw0yMzEwMDQxMDA0NDBaFw0zMDAxMzEyMzAwMDBaMEkxRzBFBgNVBAMTPnRvaWwydGhwamNwejVxNjNzNnZidXB4eHRkbjJ3NGxpY2x5NXlzcmN5cnNyanZieGhuZW5qZHlkLm9uaW9uMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE5mAo+7fqZimgOwtzVHR/sWl/8n4bXWMtk2PrQ3Eri1a05Y3upQR07UG72O3aH30QSn8upmPqUjsPtbyhtEMXi6OCAiowggImMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATCCAUcGCSqGSIb3DQEJDASCATgEggE0B/mkyxZeflBGdsVcbR1hHYOhCv8Jlb6FDAmV1HFtHzEn3WNi96hBpW/GWMnfNR5Wv0Uofzf+A51svouXtFUGEt8aELjqgHMnrwkRR5BHN3XhvVjcYpX9uLf9HcbBdMpgdcrFKLTblTlMcNGczZVAjTt5O6x6MjxlzSHlDnBt8owNPap9xwn0SFgNHfxfg4XXUml1U96G+Ayzgjmu5Hy+A+JZcqSWdK3xyBzf9g9JhSV5tit7W+xzHvD+FFc2434dbYKbJxthxXGQp3mfZz8ILaxtGEeXOewNTXTjvybv9da2ZXofj3ODAdeNZzhy4NQ2ptUU4hW8QFrpr44vJRXeT7JgTpIJaZecPD51UQ3mfqOffYzthM6zhiU5t7tiVo86a4nlVgNJLzGcVJ3aObAnT6M2dnQwGAYKKwYBBAGDjBsCAQQKEwh1c2VybmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1RS0Rqd2tVTjZYRUZQaVA5V0tBaUZjUXNZQlhIWEtzcHhHNlZ1WU1ZVkFHRzBJBgNVHREEQjBAgj50b2lsMnRocGpjcHo1cTYzczZ2YnVweHh0ZG4ydzRsaWNseTV5c3JjeXJzcmp2YnhobmVuamR5ZC5vbmlvbjAKBggqhkjOPQQDAgNIADBFAiBFaaJYuacbj60wEU9uur7lMoWwhf+uavBnKdoKg93LIQIhAMrd3PN6rggZ4gRNNzhno5yrwTm3/B0ZHaG+zGuO7J8c'

    store.dispatch(
      users.actions.storeUserCertificate({
        certificate: cert1,
      })
    )

    store.dispatch(
      users.actions.storeUserCertificate({
        certificate: cert2,
      })
    )

    await act(async () => {})

    store.dispatch(navigationActions.redirection())
    await act(async () => {})

    const duplicateCerts = users.selectors.duplicateCerts(store.getState())
    const currentScreen = navigationSelectors.currentScreen(store.getState())

    expect(currentScreen).toBe(ScreenNames.PossibleImpersonationAttackScreen)
    expect(duplicateCerts).toBeTruthy()

    root?.cancel()
  })
})
