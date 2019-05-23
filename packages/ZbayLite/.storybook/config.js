import { configure, addDecorator, addParameters } from '@storybook/react'
import { themes } from '@storybook/theming'
import { muiTheme } from 'storybook-addon-material-ui'

import theme from '../src/renderer/theme'

const req = require.context('../src/renderer/components/', true, /\.stories\.js$/)

function loadStories () {
  req.keys().forEach(filename => req(filename))
}

addDecorator(muiTheme([theme]))
addParameters({
  backgrounds: [
    { name: 'dark', value: theme.palette.primary.main, default: true },
    { name: 'light', value: '#fff' }
  ],
  options: { theme: themes.normal }
})
configure(loadStories, module)
