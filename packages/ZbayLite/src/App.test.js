import renderer from 'react-test-renderer'
import React from 'react'

import App from './App'

describe('hello', () => {
  it('this is a test', () => {
    expect(renderer.create(<App />).toJSON()).toMatchSnapshot()
  })
})
