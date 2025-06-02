import React from 'react'
import { DownloadState } from '@quiet/types'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import ImageAttachmentPlaceholder, { ImageAttachmentPlaceholderProps } from './ImageAttachmentPlaceholder'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof ImageAttachmentPlaceholder> = args => {
  return <ImageAttachmentPlaceholder {...args} />
}

export const Component = Template.bind({})

const downloadStatus = {
  mid: 'test',
  cid: 'hvb45FGa',
  downloadState: DownloadState.Completed,
}

const args: ImageAttachmentPlaceholderProps = {
  cid: 'cid',
  imageWidth: 500,
  imageHeight: 200,
  name: 'image',
  ext: '.png',
  downloadStatus: downloadStatus,
}

Component.args = args

const component: ComponentMeta<typeof ImageAttachmentPlaceholder> = {
  title: 'Components/ImageAttachmentPlaceholder',
  decorators: [withTheme],
  component: ImageAttachmentPlaceholder,
}

export default component
