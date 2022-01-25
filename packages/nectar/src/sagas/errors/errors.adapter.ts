import { createEntityAdapter } from '@reduxjs/toolkit'
import { ErrorPayload } from './errors.types'

export const errorsAdapter = createEntityAdapter<ErrorPayload>({
  selectId: (error) => error.type
})
