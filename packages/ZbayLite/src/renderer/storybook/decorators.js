import React from 'react'
import { Provider } from 'react-redux'

export const withStore = store => storyFn => (
  <Provider store={store}>
    {storyFn()}
  </Provider>
)

export default {
  withStore
}
