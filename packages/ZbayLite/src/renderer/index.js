import { Web } from './vendor/buttercup'
import React from 'react'
import { render } from 'react-dom'
import Root from './Root'

Web.HashingTools.patchCorePBKDF()

render(
  <Root />,
  document.getElementById('root')
)

module.hot.accept()
