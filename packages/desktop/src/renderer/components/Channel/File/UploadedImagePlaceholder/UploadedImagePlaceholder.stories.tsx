import React from 'react'
import { DownloadState } from '@quiet/state-manager'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import UploadedImagePlaceholder, { UploadedImagePlaceholderProps } from './UploadedImagePlaceholder'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof UploadedImagePlaceholder> = args => {
  return (
    <UploadedImagePlaceholder {...args} />
  )
}

export const Component = Template.bind({})

const downloadStatus = {
  mid: 'test',
  cid: 'hvb45FGa',
  downloadState: DownloadState.Completed
}

const args: UploadedImagePlaceholderProps = {
  cid: 'cid',
  imageWidth: 500,
  imageHeight: 200,
  name: 'image',
  ext: '.png',
  downloadStatus: downloadStatus
}

Component.args = args

const component: ComponentMeta<typeof UploadedImagePlaceholder> = {
  title: 'Components/UploadedImagePlaceholder',
  decorators: [withTheme],
  component: UploadedImagePlaceholder
}

export default component
