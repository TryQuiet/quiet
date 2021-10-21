import {
  errorsActions,
  errorsReducer,
  ErrorPayload,
  GENERAL_ERRORS,
} from './errors.slice';

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
  const state1 = errorsReducer({}, errorsActions.addError(errorPayload));
  expect(state1).toMatchInlineSnapshot(`
Object {
  "community-id": Object {
    "entities": Object {
      "community": Object {
        "code": 500,
        "communityId": "community-id",
        "message": "Error occurred",
        "type": "community",
      },
    },
    "ids": Array [
      "community",
    ],
  },
}
`);

  const state2 = errorsReducer(state1, errorsActions.addError(errorPayload2));
  expect(state2).toMatchInlineSnapshot(`
Object {
  "community-id": Object {
    "entities": Object {
      "community": Object {
        "code": 500,
        "communityId": "community-id",
        "message": "Error occurred",
        "type": "community",
      },
      "other": Object {
        "code": 403,
        "communityId": "community-id",
        "message": "Validation error occurred",
        "type": "other",
      },
    },
    "ids": Array [
      "community",
      "other",
    ],
  },
}
`);

  const state3 = errorsReducer(state2, errorsActions.addError(errorPayload3));
  expect(state3).toMatchInlineSnapshot(`
Object {
  "community-id": Object {
    "entities": Object {
      "community": Object {
        "code": 500,
        "communityId": "community-id",
        "message": "Error occurred",
        "type": "community",
      },
      "other": Object {
        "code": 403,
        "communityId": "community-id",
        "message": "Validation error occurred",
        "type": "other",
      },
    },
    "ids": Array [
      "community",
      "other",
    ],
  },
  "different-community-id": Object {
    "entities": Object {
      "community": Object {
        "code": 403,
        "communityId": "different-community-id",
        "message": "Validation error occurred",
        "type": "community",
      },
    },
    "ids": Array [
      "community",
    ],
  },
}
`);
  const state4 = errorsReducer(
    state3,
    errorsActions.addError({
      ...errorPayloadGeneral,
      communityId: GENERAL_ERRORS,
    })
  );

  expect(state4).toMatchInlineSnapshot(`
Object {
  "community-id": Object {
    "entities": Object {
      "community": Object {
        "code": 500,
        "communityId": "community-id",
        "message": "Error occurred",
        "type": "community",
      },
      "other": Object {
        "code": 403,
        "communityId": "community-id",
        "message": "Validation error occurred",
        "type": "other",
      },
    },
    "ids": Array [
      "community",
      "other",
    ],
  },
  "different-community-id": Object {
    "entities": Object {
      "community": Object {
        "code": 403,
        "communityId": "different-community-id",
        "message": "Validation error occurred",
        "type": "community",
      },
    },
    "ids": Array [
      "community",
    ],
  },
  "general": Object {
    "entities": Object {
      "activity": Object {
        "code": 500,
        "communityId": "general",
        "message": "Some error occurred",
        "type": "activity",
      },
    },
    "ids": Array [
      "activity",
    ],
  },
}
`);
});
