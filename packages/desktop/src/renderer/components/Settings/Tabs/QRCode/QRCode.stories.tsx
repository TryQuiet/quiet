import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../../storybook/decorators'
import QRCodeComponent, { QRCodeProps } from './QRCode.component'

const Template: ComponentStory<typeof QRCodeComponent> = args => {
  return <QRCodeComponent {...args} />
}

export const Component = Template.bind({})

const args: QRCodeProps = {
  value: 'value'
}

Component.args = args

const component: ComponentMeta<typeof QRCodeComponent> = {
  title: 'Components/QRCode',
  decorators: [withTheme],
  component: QRCodeComponent
}

export default component
