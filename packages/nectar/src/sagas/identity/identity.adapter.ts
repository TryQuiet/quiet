import { createEntityAdapter } from '@reduxjs/toolkit'
import { Identity } from './identity.types'

export const identityAdapter = createEntityAdapter<Identity>({
  selectId: (identity) => identity.id
})
