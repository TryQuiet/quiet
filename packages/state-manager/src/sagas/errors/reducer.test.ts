import { errorsActions, errorsReducer, ErrorsState } from './errors.slice'

test('errors reducer should set errors', () => {
  const errorPayload = {
    community: 'community-id',
    type: 'community',
    code: 500,
    message: 'Error occurred',
  }
  const errorPayload2 = {
    community: 'community-id',
    type: 'other',
    code: 403,
    message: 'Validation error occurred',
  }
  const errorPayload3 = {
    community: 'different-community-id',
    type: 'community',
    code: 403,
    message: 'Validation error occurred',
  }
  const errorPayloadGeneral = {
    type: 'activity',
    code: 500,
    message: 'Some error occurred',
  }
  const state1 = errorsReducer({ ...new ErrorsState() }, errorsActions.addError(errorPayload))
  expect(state1).toMatchInlineSnapshot(`
    Object {
      "errors": Object {
        "entities": Object {
          "community": Object {
            "code": 500,
            "community": "community-id",
            "message": "Error occurred",
            "type": "community",
          },
        },
        "ids": Array [
          "community",
        ],
      },
    }
  `)

  const state2 = errorsReducer(state1, errorsActions.addError(errorPayload2))
  expect(state2).toMatchInlineSnapshot(`
    Object {
      "errors": Object {
        "entities": Object {
          "community": Object {
            "code": 500,
            "community": "community-id",
            "message": "Error occurred",
            "type": "community",
          },
          "other": Object {
            "code": 403,
            "community": "community-id",
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
  `)

  const state3 = errorsReducer(state2, errorsActions.addError(errorPayload3))
  expect(state3).toMatchInlineSnapshot(`
    Object {
      "errors": Object {
        "entities": Object {
          "community": Object {
            "code": 403,
            "community": "different-community-id",
            "message": "Validation error occurred",
            "type": "community",
          },
          "other": Object {
            "code": 403,
            "community": "community-id",
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
  `)
  const state4 = errorsReducer(
    state3,
    errorsActions.addError({
      ...errorPayloadGeneral,
    })
  )

  expect(state4).toMatchInlineSnapshot(`
    Object {
      "errors": Object {
        "entities": Object {
          "activity": Object {
            "code": 500,
            "message": "Some error occurred",
            "type": "activity",
          },
          "community": Object {
            "code": 403,
            "community": "different-community-id",
            "message": "Validation error occurred",
            "type": "community",
          },
          "other": Object {
            "code": 403,
            "community": "community-id",
            "message": "Validation error occurred",
            "type": "other",
          },
        },
        "ids": Array [
          "community",
          "other",
          "activity",
        ],
      },
    }
  `)
})
