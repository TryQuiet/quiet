import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { apply, take } from 'typed-redux-saga'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { communities, identity } from '@zbayapp/nectar'
import { SocketState } from '../../../sagas/socket/socket.slice'
import { ModalsInitialState } from '../../../sagas/modals/modals.slice'
import JoinCommunity from './joinCommunity'
import CreateUsernameModal from '../createUsernameModal/CreateUsername'
import { ModalName } from '../../../sagas/modals/modals.types'
import { JoinCommunityDictionary } from '../../../components/widgets/performCommunityAction/PerformCommunityAction.dictionary'
import MockedSocket from 'socket.io-mock'
import { act } from 'react-dom/test-utils'
import { ioMock } from '../../../../shared/setupTests'
import { SocketActionTypes } from '@zbayapp/nectar/lib/sagas/socket/const/actionTypes'
import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

const payload = (id: string): Partial<Identity> => ({
  id: id,
  hiddenService: {
    onionAddress: 'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd',
    privateKey:
      'ED25519-V3:eECPVkKQxx0SADnjaqAxheH797Q79D0DqGu8Pbc83mpfaZSujZdxqJ6r5ZwUDWCYAegWx2xNkMt7zUKXyxKOuQ=='
  },
  peerId: {
    id: 'QmPdB7oUGiDEz3oanj58Eba595H2dtNiKtW7bNTrBey5Az',
    privKey:
      'CAASqAkwggSkAgEAAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAECggEAXUbrwE2m9ONZdqLyMWJoNghsh+qbwbzXIDFmT4yXaa2qf2BExQPGZhDMlP5cyrKuxw0RX2DjrUWpBZ5evVdsBWZ5IXYNd4NST0G8/OsDqw5DIVQb19gF5wBlNnWCL7woMnukCOB/Dhul4x2AHo2STuanP7bQ8RrsAp4njAivZydZADv2Xo4+ll+CBquJOHRMjcIqXzaKLoXTf80euskHfizFT4cFsI6oZygx8yqstoz2SBj2Qr3hvkUmSBFhE+dChIRrpcYuuz0JPpUTBmGgCLdKarUJHH1GJ4+wc6YU9YmJJ3kqyR+h/oVGaB1j4YOd5ubtJAIvf7uj0Ofhq1FJhQKBgQDrgsrUAZCafk81HAU25EmfrvH0jbTvZ7LmM86lntov8viOUDVk31F3u+CWGP7L/UomMIiveqO8J9OpQCvK8/AgIahtcB6rYyyb7XGLBn+njfVzdg8e2S4G91USeNuugYtwgpylkotOaAZrmiLgl415UgJvhAaOf+sMzV5xLREWMwKBgQCg+9iU7rDpgx8Tcd9tf5hGCwK9sorC004ffxtMXa+nN1I+gCfQH9eypFbmVnAo6YRQS02sUr9kSfB1U4f7Hk1VH/Wu+nRJNdTfz4uV5e65dSIo3kga8aTZ8YTIlqtDwcVv0GDCxDcstpdmR3scua0p2Oq22cYrmHOBgSGgdX0mewKBgQCPm/rImoet3ZW5IfQAC+blK424/Ww2jDpn63F4Rsxvbq6oQTq93vtTksoZXPaKN1KuxOukbZlIU9TaoRnTMTrcrQmCalsZUWlTT8/r4bOX3ZWtqXEA85gAgXNrxyzWVYJMwih5QkoWLpKzrJLV9zQ6pYp8q7o/zLrs3JJZWwzPRwKBgDrHWfAfKvdICfu2k0bO1NGWSZzr6OBz+M1lQplih7U9bMknT+IdDkvK13Po0bEOemI67JRj7j/3A1ZDdp4JFWFkdvc5uWXVwvEpPaUwvDZ4/0z+xEMaQf/VwI7g/I2T3bwS0JGsxRyNWsBcjyYQ4Zoq+qBi6YmXc20wsg99doGrAoGBAIXD8SW9TNhbo3uGK0Tz7y8bdYT4M9krM53M7I62zU6yLMZLTZHX1qXjbAFhEU5wVm6Mq0m83r1fiwnTrBQbn1JBtEIaxCeQ2ZH7jWmAaAOQ2z3qrHenD41WQJBzpWh9q/tn9JKD1KiWykQDfEnMgBt9+W/g3VgAF+CnR+feX6aH',
    pubKey:
      'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAE='
  }
})

describe('User', () => {
  let socket: MockedSocket
  let communityId: string

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('joins community and registers username', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Socket]: {
          ...new SocketState(),
          isConnected: false
        },
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.joinCommunityModal]: { open: true }
        }
      },
      socket // Fork Nectar's sagas
    )

    renderComponent(
      <>
        <JoinCommunity />
        <CreateUsernameModal />
      </>,
      store
    )

    type socketEventData<T extends unknown[]> = [...T]

    jest.spyOn(socket, 'emit').mockImplementation((action: SocketActionTypes, ...input: any[]) => {
      if (action === SocketActionTypes.CREATE_NETWORK) {
        const data = input as socketEventData<[string]>
        communityId = data[0]
        return socket.socketClient.emit(SocketActionTypes.NEW_COMMUNITY, {
          id: communityId,
          payload: payload(communityId)
        })
      }
      if (action === SocketActionTypes.REGISTER_USER_CERTIFICATE) {
        const data = input as socketEventData<
        [string, string, string]
        >
        const communityId = data[2]
        return socket.socketClient.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
          id: communityId,
          payload: {
            peers: [''],
            certificate: 'MIIBTDCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABEaV1l/7BOvPh0fFteSubIJ2r66YM4XoMMEfUhHiJE6O0ojfHdNrsItg+pHmpIQyEe+3YGWxIhgjL65+liE8ypqjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNIADBFAiARHtkv7GlhfkFbtRGU1r19UJFkhA7Vu+EubBnJPjD9/QIhALje1S3bp8w8jjVf70jGc2/uRmDCo/bNyQRpApBaD5vY',
            rootCa: 'rootCa'
          }
        })
      }
    })

    // Confirm proper modal title is displayed
    const dictionary = JoinCommunityDictionary()
    const joinCommunityTitle = screen.getByText(dictionary.header)
    expect(joinCommunityTitle).toBeVisible()

    // Enter community address and hit button
    const joinCommunityInput = screen.getByPlaceholderText(dictionary.placeholder)
    const joinCommunityButton = screen.getByText(dictionary.button)
    userEvent.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd')
    userEvent.click(joinCommunityButton)

    // Confirm user is being redirected to username registration
    const createUsernameTitle = await screen.findByText('Register a username')
    expect(createUsernameTitle).toBeVisible()

    // Enter username and hit button
    const createUsernameInput = await screen.findByPlaceholderText('Enter a username')
    const createUsernameButton = await screen.findByText('Register')
    userEvent.type(createUsernameInput, 'holmes')
    userEvent.click(createUsernameButton)

    await act(async () => {
      await runSaga(testJoinCommunitySaga).toPromise()
      await runSaga(mockChannelsResponse).toPromise()
    })

    expect(createUsernameTitle).not.toBeVisible()
    expect(joinCommunityTitle).not.toBeVisible()
  })

  function* testJoinCommunitySaga(): Generator {
    yield* take(communities.actions.joinCommunity)
    yield* take(communities.actions.responseCreateCommunity)
    yield* take(identity.actions.registerUsername)
    yield* take(identity.actions.storeUserCertificate)
  }

  function* mockChannelsResponse(): Generator {
    yield* apply(socket.socketClient, socket.socketClient.emit, [SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
      communityId: communityId,
      channels: {
        general: {
          name: 'general',
          description: 'string',
          owner: 'string',
          timestamp: 0,
          address: 'string'
        }
      }
    }])
  }
})
