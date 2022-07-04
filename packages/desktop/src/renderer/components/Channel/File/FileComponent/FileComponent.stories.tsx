import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import FileComponent, { FileComponentProps } from './FileComponent'
import { withTheme } from '../../../../storybook/decorators'
import { DownloadState } from '@quiet/state-manager'

const Template: ComponentStory<typeof FileComponent> = args => {
  return (
    <div style={{ marginTop: '40px' }}>
      <FileComponent {...args} />
    </div>
  )
}

export const Uploading = Template.bind({})
export const Hosted = Template.bind({})
export const Queued = Template.bind({})
export const Ready = Template.bind({})
export const Downloading = Template.bind({})
export const Canceled = Template.bind({})
export const Completed = Template.bind({})

const cid = 'QmWUCSApiy76nW9DAk5M9QbH1nkW5XCYwxUHRSULjATyqs'

const args: FileComponentProps = {
  message: {
    id: '32',
    type: 2,
    media: {
      cid: cid,
      message: {
        channelAddress: 'general',
        id: 'wgtlstx3u7'
      },
      ext: '.zip',
      name: 'my-file-name-goes-here-an-isnt-truncated',
      size: 1024,
      width: undefined,
      height: undefined,
      path: 'files/my-file-name-goes-here-an-isnt-truncated.zip'
    },
    message: '',
    createdAt: 0,
    date: '12:46',
    nickname: 'vader'
  },
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Ready,
    downloadProgress: undefined
  }
}

Uploading.args = {
  ...args,
  message: {
    ...args.message,
    media: {
      ...args.message.media,
      size: undefined
    }
  },
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Uploading,
    downloadProgress: undefined
  }
}
Hosted.args = {
  ...args,
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Hosted,
    downloadProgress: undefined
  }
},
Queued.args = {
  ...args,
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Queued,
    downloadProgress: {
      size: 2048,
      downloaded: 0,
      transferSpeed: 0
    }
  },
  cancel: () => { console.log('cancel download') }
}
Ready.args = {
  ...args,
  download: () => { console.log('download file') }
}
Downloading.args = {
  ...args,
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Downloading,
    downloadProgress: {
      size: 1024,
      downloaded: 256,
      transferSpeed: 32
    }
  },
  cancel: () => { console.log('cancel download') }
}
Canceled.args = {
  ...args,
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Canceled
  },
}
Completed.args = {
  ...args,
  downloadStatus: {
    cid: cid,
    downloadState: DownloadState.Completed,
    downloadProgress: {
      size: 1024,
      downloaded: 1024,
      transferSpeed: 0
    }
  },
  show: () => { console.log('show in folder') }
}

const component: ComponentMeta<typeof FileComponent> = {
  title: 'Components/FileComponent',
  decorators: [withTheme],
  component: FileComponent
}

export default component
