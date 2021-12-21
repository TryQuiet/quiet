import { createEntityAdapter } from '@reduxjs/toolkit'
import { keyFromCertificate } from '@zbayapp/identity'
import { Certificate } from 'pkijs'

export const certificatesAdapter = createEntityAdapter<Certificate>({
  selectId: keyFromCertificate
})
