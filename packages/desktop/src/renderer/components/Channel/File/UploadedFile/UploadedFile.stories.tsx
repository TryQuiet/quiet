import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import UploadedFile, { UploadedFileProps } from './UploadedFile'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof UploadedFile> = args => {
  return <UploadedFile {...args} />
}

export const Component = Template.bind({})

const args: UploadedFileProps = {
  message: {
    id: '32',
    type: 2,
    media: {
      cid: 'QmWUCSApiy76nW9DAk5M9QbH1nkW5XCYwxUHRSULjATyqs',
      message: {
        channelAddress: 'general',
        id: 'wgtlstx3u7'
      },
      ext: '.zip',
      name: 'my-file-name-goes-here-an-isnt-truncated',
      width: 1200,
      height: 580,
      path: 'files/my-file-name-goes-here-an-isnt-truncated.zip'
    },
    message: '',
    createdAt: 0,
    date: '12:46',
    nickname: 'vader'
  }
}

Component.args = args

const component: ComponentMeta<typeof UploadedFile> = {
  title: 'Components/UploadedFile',
  decorators: [withTheme],
  component: UploadedFile
}

export default component
