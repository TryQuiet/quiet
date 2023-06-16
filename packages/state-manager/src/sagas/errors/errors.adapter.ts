import { type ErrorPayload } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const errorsAdapter = createEntityAdapter<ErrorPayload>({
  selectId: (error) => error.type
})
