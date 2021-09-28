import { createEntityAdapter } from '@reduxjs/toolkit';
import { ErrorsState, ErrorState } from './errors.slice';

export const errorAdapter = createEntityAdapter<ErrorState>({
  selectId: (error) => error.type,
});

export const errorsAdapter = createEntityAdapter<ErrorsState>({
  selectId: (error) => error.id,
});
