import { createEntityAdapter } from '@reduxjs/toolkit'
import { Identity } from '@quiet/types'

export const identityAdapter = createEntityAdapter<Identity>({
  selectId: (identity) => identity.id
})
