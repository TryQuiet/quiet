import React from 'react'
import { render } from 'react-dom'
import App from './App'

render(
  <App />,
  document.getElementsByTagName('body')[0]
)

module.hot.accept()
