import { getInvitationCodes } from './invitationCode'
import { QUIET_JOIN_PAGE } from '@quiet/common'

describe('Invitation code helper', () => {
  const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
  const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
  const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
  const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'

  it('retrieves invitation code if url is a proper share url', () => {
    const result = getInvitationCodes(`${QUIET_JOIN_PAGE}#${peerId1}=${address1}&${peerId2}=${address2}`)
    expect(result).toEqual([
      { peerId: peerId1, onionAddress: address1 },
      { peerId: peerId2, onionAddress: address2 },
    ])
  })

  it('returns empty list if code is not a proper share url nor a code', () => {
    const result = getInvitationCodes('invalidCode')
    expect(result).toEqual([])
  })

  it('retrieves invitation code if url is a proper code', () => {
    const result = getInvitationCodes(`${peerId1}=${address1}&${peerId2}=${address2}`)
    expect(result).toEqual([
      { peerId: peerId1, onionAddress: address1 },
      { peerId: peerId2, onionAddress: address2 },
    ])
  })
})
