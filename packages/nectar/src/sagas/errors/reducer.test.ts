import { errorsAdapter } from './errors.adapter';
import { errorsActions, errorsReducer, GENERAL_ERRORS } from './errors.slice';

test('errors reducer should set errors', () => {
  const errorPayload = {
    type: 'community',
    code: 500,
    message: 'Error occurred',
    communityId: 'community-id',
  };
  const errorPayload2 = {
    type: 'other',
    code: 403,
    message: 'Validation error occurred',
    communityId: 'community-id',
  };
  const errorPayload3 = {
    type: 'community',
    code: 403,
    message: 'Validation error occurred',
    communityId: 'different-community-id',
  };
  const errorPayloadGeneral = {
    type: 'activity',
    code: 500,
    message: 'Some error occurred',
  };
  const state1 = errorsReducer(
    errorsAdapter.getInitialState(),
    errorsActions.addError(errorPayload)
  );
  const state2 = errorsReducer(state1, errorsActions.addError(errorPayload2));
  const state3 = errorsReducer(state2, errorsActions.addError(errorPayload3));
  const state4 = errorsReducer(
    state3,
    errorsActions.addError(errorPayloadGeneral)
  );
  expect(state4).toEqual({
    ids: [errorPayload.communityId, errorPayload3.communityId, GENERAL_ERRORS],
    entities: {
      [errorPayload.communityId]: {
        id: errorPayload.communityId,
        errors: {
          ids: [errorPayload.type, errorPayload2.type],
          entities: {
            [errorPayload.type]: {
              ...errorPayload,
            },
            [errorPayload2.type]: {
              ...errorPayload2,
            },
          },
        },
      },
      [errorPayload3.communityId]: {
        id: errorPayload3.communityId,
        errors: {
          ids: [errorPayload3.type],
          entities: {
            [errorPayload3.type]: {
              ...errorPayload3,
            },
          },
        },
      },
      general: {
        id: GENERAL_ERRORS,
        errors: {
          ids: [errorPayloadGeneral.type],
          entities: {
            [errorPayloadGeneral.type]: {
              ...errorPayloadGeneral,
              communityId: null,
            },
          },
        },
      },
    },
  });
});
