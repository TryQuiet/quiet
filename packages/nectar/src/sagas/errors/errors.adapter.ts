import { createEntityAdapter } from '@reduxjs/toolkit';
import { ErrorPayload } from './errors.slice';

export const errorsAdapter = createEntityAdapter<ErrorPayload>({
  selectId: (error) => error.type,
});
