import { getInvitationCodes } from './invitationCode'
import { QUIET_JOIN_PAGE } from '@quiet/common'

describe('Invitation code helper', () => {
  const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
  const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
  const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'

  it('retrieves invitation code if url is a proper share url', () => {
    const psk = 'abcde'
    const result = getInvitationCodes(`${QUIET_JOIN_PAGE}#${peerId1}=${address1}&${peerId2}=${address2}&k=${psk}`)
    expect(result).toEqual({
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk,
    })
  })

  it('throws error if code is not a proper share url nor a code', () => {
    // const result = 'invalidCode')
    expect(() => getInvitationCodes('invalidCode')).toThrow()
  })

  it('throws error if code does not contain psk', () => {
    expect(() => getInvitationCodes(`${peerId1}=${address1}&${peerId2}=${address2}`)).toThrow()
  })

  it('retrieves invitation code if url is a proper code', () => {
    const psk = 'abcde'
    const result = getInvitationCodes(`${peerId1}=${address1}&${peerId2}=${address2}&k=${psk}`)
    expect(result).toEqual({
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk,
    })
  })

  it('retrieves invitation code if url is a proper code', () => {
    const psk = 'abcde'
    const result = getInvitationCodes(`${peerId1}=${address1}&${peerId2}=${address2}&k=${psk}`)
    expect(result).toEqual({
      pairs: [
        { peerId: peerId1, onionAddress: address1 },
        { peerId: peerId2, onionAddress: address2 },
      ],
      psk,
    })
  })
})
