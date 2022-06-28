import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import FileComponent, { FileComponentProps } from './FileComponent'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof FileComponent> = args => {
  return <FileComponent {...args} />
}

export const Component = Template.bind({})

const args: FileComponentProps = {
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

const component: ComponentMeta<typeof FileComponent> = {
  title: 'Components/FileComponent',
  decorators: [withTheme],
  component: FileComponent
}

export default component
