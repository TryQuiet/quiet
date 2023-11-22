import { MessagesDailyGroups } from '@quiet/types'
import { dialog } from '@electron/remote'
import fs from 'fs'

export const exportChats = async (channelName: string, channelMessages: MessagesDailyGroups) => {
  dialog
    .showSaveDialog({
      title: 'Save file',
      defaultPath: `${channelName}.txt`,
      buttonLabel: 'Save',

      filters: [
        { name: 'txt', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    .then(({ filePath }) => {
      if (filePath) {
        fs.writeFile(filePath, channelMessagesToText(channelMessages), err => {
          if (err) {
            console.log(err)
          }
        })
      }
    })
}

// This function is exported just to test it
export const channelMessagesToText = (channelMessages: MessagesDailyGroups) => {
  return Object.keys(channelMessages)
    .map(day =>
      channelMessages[day]
        .map(messages =>
          messages.map(message => `[${message.nickname} ${message.date}]\n${message.message}\n\n`).join('')
        )
        .join('')
    )
    .join('\n')
}
