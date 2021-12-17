import { createEntityAdapter } from '@reduxjs/toolkit'
import { Identity } from './identity.slice'

export const identityAdapter = createEntityAdapter<Identity>({
  selectId: (identity) => identity.id
})
