import { createEntityAdapter } from '@reduxjs/toolkit'
import { keyFromCertificate } from '@quiet/identity'
import { Certificate } from 'pkijs'

export const certificatesAdapter = createEntityAdapter<any>({
    selectId: keyFromCertificate,
})
