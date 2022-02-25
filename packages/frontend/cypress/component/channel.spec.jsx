import React from 'react'
import { mount } from '@cypress/react'
// import { composeStories, setGlobalConfig } from '@storybook/testing-react'
// import { Component as Channel } from '../../../src/renderer/components/Channel/Channel.stories'
// import { withTheme } from '../../../src/renderer/storybook/decorators'
// import CssBaseline from '@mui/material/CssBaseline'

import { it } from 'local-cypress'

// setGlobalConfig(withTheme)

// const Primary = composeStories(Channel)

it('should render basic component', () => {
  mount(
    <React.Fragment>
      <div>dupa</div>
       {/* <CssBaseline>
         <Primary />
      </CssBaseline> */}
    </React.Fragment>
  )
})