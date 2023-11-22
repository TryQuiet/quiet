import { getInvitationCodes } from './invitationCode'
import { PSK_PARAM_KEY, QUIET_JOIN_PAGE } from '@quiet/common'

describe('Invitation code helper', () => {
    const peerId1 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA'
    const address1 = 'gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad'
    const peerId2 = 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE'
    const address2 = 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd'
    const psk = 'BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw='
    const encodedPsk = encodeURIComponent(psk)

    it('retrieves invitation code if url is a proper share url', () => {
        const result = getInvitationCodes(
            `${QUIET_JOIN_PAGE}#${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=${encodedPsk}`
        )
        expect(result).toEqual({
            pairs: [
                { peerId: peerId1, onionAddress: address1 },
                { peerId: peerId2, onionAddress: address2 },
            ],
            psk,
        })
    })

    it('throws error if code is not a proper share url nor a code', () => {
        expect(() => getInvitationCodes('invalidCode')).toThrow()
    })

    it('throws error if code does not contain psk', () => {
        expect(() => getInvitationCodes(`${peerId1}=${address1}&${peerId2}=${address2}`)).toThrow()
    })

    it('throws error if psk has invalid format', () => {
        expect(() =>
            getInvitationCodes(`${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=12345`)
        ).toThrow()
    })

    it('retrieves invitation code if url is a proper code', () => {
        const result = getInvitationCodes(
            `${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=${encodedPsk}`
        )
        expect(result).toEqual({
            pairs: [
                { peerId: peerId1, onionAddress: address1 },
                { peerId: peerId2, onionAddress: address2 },
            ],
            psk,
        })
    })

    it('retrieves invitation code if url is a proper code', () => {
        const result = getInvitationCodes(
            `${peerId1}=${address1}&${peerId2}=${address2}&${PSK_PARAM_KEY}=${encodedPsk}`
        )
        expect(result).toEqual({
            pairs: [
                { peerId: peerId1, onionAddress: address1 },
                { peerId: peerId2, onionAddress: address2 },
            ],
            psk,
        })
    })
})
