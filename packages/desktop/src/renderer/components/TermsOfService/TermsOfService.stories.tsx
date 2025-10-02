import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'
import TermsOfServiceComponent, { TermsOfServiceComponentProps } from './TermsOfServiceComponent'

const Template: ComponentStory<typeof TermsOfServiceComponent> = args => {
  return <TermsOfServiceComponent {...args} />
}

export const Component = Template.bind({})

const args: TermsOfServiceComponentProps = {
  open: true,
  handleClose: () => {
    // eslint-disable-next-line no-console
    console.info('TermsOfService closed with selection: false')
  },
  onChoose: selection => {
    // eslint-disable-next-line no-console
    console.info('TermsOfService onChoose with selection:', selection)
  },
  openURL: () => {
    // eslint-disable-next-line no-console
    console.info('TermsOfService openURL called')
  },
  qssEndPoint: 'qss.tryquiet.org',
}

Component.args = args

const component: ComponentMeta<typeof TermsOfServiceComponent> = {
  title: 'Components/TermsOfService',
  decorators: [withTheme],
  component: TermsOfServiceComponent,
}

export default component
