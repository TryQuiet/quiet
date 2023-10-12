import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import { Task } from 'redux-saga'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { getFactory, identity, communities, Identity, Store, users } from '@quiet/state-manager'
import PossibleImpersonationAttackModalContainer from '../renderer/components/widgets/possibleImpersonationAttackModal/PossibleImpersonationAttackModal.container'
import { type Community } from '@quiet/types'

jest.setTimeout(20_000)

jest.mock('../renderer/index', () => ({
  clearCommunity: () => {},
}))

jest.mock('electron', () => {
  return {
    ipcRenderer: { on: () => {}, send: jest.fn(), sendSync: jest.fn() },
    remote: {
      BrowserWindow: {
        getAllWindows: () => {
          return [
            {
              show: jest.fn(),
              isFocused: jest.fn(),
            },
          ]
        },
      },
    },
  }
})

describe('Possible Impersonation Attack', () => {
  let socket: MockedSocket

  let redux: {
    store: Store
    runSaga: (saga: any) => Task
  }
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))

    redux = await prepareStore({}, socket)
    factory = await getFactory(redux.store)

    community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })
  })

  it('Open modal when certifcates are duplicated', async () => {
    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <PossibleImpersonationAttackModalContainer />
      </>,
      redux.store
    )

    const cert1 =
      'MIIDeDCCAx6gAwIBAgIGAYr6Jw3hMAoGCCqGSM49BAMCMA8xDTALBgNVBAMTBGZyZmQwHhcNMjMxMDA0MTAwNjE4WhcNMzAwMTMxMjMwMDAwWjBJMUcwRQYDVQQDEz5tenhydWhyNWJzdGt3dmp3eWJnZ2Y2M2Jma2dreWw0aWs0bG5lanN1YnFlaG9td3Vpbm43d3JxZC5vbmlvbjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGcKhXLUNjkS9+xd0hYfJBOA7bXB5LwZojhzgBQps3SW/CSR6ABiAuirdP0x/byxTXSkZY23lBkvc5CqMjWe3lWjggIqMIICJjAJBgNVHRMEAjAAMAsGA1UdDwQEAwIAgDAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwggFHBgkqhkiG9w0BCQwEggE4BIIBNAXhwXxmLy7Gg5uonlWXiqRUimGLj2cPbAoK9DnKHkcohqdLvEzyz6rM7KBewO068fag0d/PR0uh37Oyb7d/JAbBjhJmf8wOl2HfLTThPEEH8isy3bxHXx4Ir5prVVk1zx8UiXtPAu6gK41FY5Oin6SpV07MBewqQGcbCovcbBSwkp6EXmLXPOGgmpFlQf5CNGIs3YqPD+Ll1vn8Lq5QIGCa210Pq/T65mrPsXVAw2vJO6DFRIAGrAF5VxDS8G2dSwnDnje+bD2NO8qlfwFdO3bkDeheOqZXCSxlPA6q1bY34qYR2zrwSiQCjRiCQjifRCmF2Jg4ojzLGUL0pKdvi+8fDQXollmazh5boJWN9GRy+1sDLTk01cW2kF7esew5PlDi8kX0v2hY+XsR5eQga1j3MkXkMBgGCisGAQQBg4wbAgEEChMIdXNlcm5hbWUwPQYJKwYBAgEPAwEBBDATLlFtUHF6THFheFk1UmI4VlpjM1VuZmlXZXRxVDZKWkp6SnRjWVFXNmhXTENvRXIwSQYDVR0RBEIwQII+bXp4cnVocjVic3Rrd3Zqd3liZ2dmNjNiZmtna3lsNGlrNGxuZWpzdWJxZWhvbXd1aW5uN3dycWQub25pb24wCgYIKoZIzj0EAwIDSAAwRQIhAJx4YX8KtOA4WGAWzW0M7FvuoblNOb370521GsfuHfbMAiBEYQ4l074oUEF2DTVK1agJlhMR5USRxav5xEpx2ujMeA=='

    const cert2 =
      'MIIDdzCCAx2gAwIBAgIGAYr6JZFvMAoGCCqGSM49BAMCMA4xDDAKBgNVBAMTA2RldjAeFw0yMzEwMDQxMDA0NDBaFw0zMDAxMzEyMzAwMDBaMEkxRzBFBgNVBAMTPnRvaWwydGhwamNwejVxNjNzNnZidXB4eHRkbjJ3NGxpY2x5NXlzcmN5cnNyanZieGhuZW5qZHlkLm9uaW9uMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE5mAo+7fqZimgOwtzVHR/sWl/8n4bXWMtk2PrQ3Eri1a05Y3upQR07UG72O3aH30QSn8upmPqUjsPtbyhtEMXi6OCAiowggImMAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATCCAUcGCSqGSIb3DQEJDASCATgEggE0B/mkyxZeflBGdsVcbR1hHYOhCv8Jlb6FDAmV1HFtHzEn3WNi96hBpW/GWMnfNR5Wv0Uofzf+A51svouXtFUGEt8aELjqgHMnrwkRR5BHN3XhvVjcYpX9uLf9HcbBdMpgdcrFKLTblTlMcNGczZVAjTt5O6x6MjxlzSHlDnBt8owNPap9xwn0SFgNHfxfg4XXUml1U96G+Ayzgjmu5Hy+A+JZcqSWdK3xyBzf9g9JhSV5tit7W+xzHvD+FFc2434dbYKbJxthxXGQp3mfZz8ILaxtGEeXOewNTXTjvybv9da2ZXofj3ODAdeNZzhy4NQ2ptUU4hW8QFrpr44vJRXeT7JgTpIJaZecPD51UQ3mfqOffYzthM6zhiU5t7tiVo86a4nlVgNJLzGcVJ3aObAnT6M2dnQwGAYKKwYBBAGDjBsCAQQKEwh1c2VybmFtZTA9BgkrBgECAQ8DAQEEMBMuUW1RS0Rqd2tVTjZYRUZQaVA5V0tBaUZjUXNZQlhIWEtzcHhHNlZ1WU1ZVkFHRzBJBgNVHREEQjBAgj50b2lsMnRocGpjcHo1cTYzczZ2YnVweHh0ZG4ydzRsaWNseTV5c3JjeXJzcmp2YnhobmVuamR5ZC5vbmlvbjAKBggqhkjOPQQDAgNIADBFAiBFaaJYuacbj60wEU9uur7lMoWwhf+uavBnKdoKg93LIQIhAMrd3PN6rggZ4gRNNzhno5yrwTm3/B0ZHaG+zGuO7J8c'

    redux.store.dispatch(
      users.actions.storeUserCertificate({
        certificate: cert1,
      })
    )

    redux.store.dispatch(
      users.actions.storeUserCertificate({
        certificate: cert2,
      })
    )
    await act(async () => {})

    const modal = screen.getByTestId('possible-impersonation-attack-modal-component')
    expect(modal).toBeVisible()

    const button = screen.getByTestId('unregistered-button')
    expect(button).toBeVisible()
  })
})
