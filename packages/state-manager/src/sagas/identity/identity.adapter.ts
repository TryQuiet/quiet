import { createEntityAdapter } from '@reduxjs/toolkit'
import { type Identity } from '@quiet/types'

export const identityAdapter = createEntityAdapter<Identity>({
  selectId: (identity) => identity.id
})
