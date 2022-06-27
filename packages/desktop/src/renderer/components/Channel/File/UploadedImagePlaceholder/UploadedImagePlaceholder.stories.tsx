import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import UploadedImagePlaceholder, { UploadedImagePlaceholderProps } from './UploadedImagePlaceholder'
import { withTheme } from '../../../../storybook/decorators'


const Template: ComponentStory<typeof UploadedImagePlaceholder> = args => {
  return (
    <UploadedImagePlaceholder {...args} />
  )
}

export const Component = Template.bind({})

const args: UploadedImagePlaceholderProps = {
    cid: 'cid',
    imageWidth: 500,
    imageHeight: 200,
    name: 'image',
    ext: '.png'
}

Component.args = args

const component: ComponentMeta<typeof UploadedImagePlaceholder> = {
  title: 'Components/UploadedImagePlaceholder',
  decorators: [withTheme],
  component: UploadedImagePlaceholder
}

export default component
