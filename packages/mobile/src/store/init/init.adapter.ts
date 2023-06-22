import { createEntityAdapter } from '@reduxjs/toolkit'
import { InitCheck } from './init.types'

export const initChecksAdapter = createEntityAdapter<InitCheck>({
  selectId: check => check.event,
})
